import { NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';
import { supabase } from '@/lib/supabase';

function upscaleThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/=s\d+-[a-zA-Z0-9-]+/, '=s512-c')
    .replace(/=w\d+-h\d+-[a-zA-Z0-9-]+/, '=w512-h512-p-l90-rj')
    .replace(/\/s\d+\//, '/s512/')
    .replace(/w\d+-h\d+/, 'w512-h512');
}

export async function POST(req: Request) {
  try {
    const { artistId } = await req.json();
    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
    }

    const yt = await Innertube.create();
    const artist = await yt.music.getArtist(artistId);

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const artistName = artist.header?.title?.toString() || 'Unknown Artist';
    const description = (artist.header as any)?.description?.toString() || '';
    
    // Get thumbnail and banner
    let avatarUrl = '';
    let bannerUrl = '';
    const thumbnails = (artist.header as any)?.thumbnail?.contents || [];
    if (thumbnails.length > 0) {
      avatarUrl = upscaleThumbnail(thumbnails[thumbnails.length - 1]?.url) || ''; // Get highest res
    }
    // Note: banner isn't easily exposed without parsing deeper, we can use avatar for now or leave banner empty if not found.

    // 1. Upsert Artist
    const { data: artistRow, error: artistError } = await (supabase.from('artists') as any)
      .upsert(
        { youtube_id: artistId, name: artistName, description, avatar_url: avatarUrl, banner_url: bannerUrl } as any,
        { onConflict: 'youtube_id' }
      )
      .select()
      .single();

    if (artistError || !artistRow) {
      throw artistError || new Error('Failed to upsert artist');
    }

    const dbArtistId = (artistRow as any).id;
    let totalSongsAdded = 0;
    let totalAlbumsAdded = 0;

    // 2. Extract Top Songs (נסה למשוך את כל השירים אם יש פונקציה זמינה)
    let allTopSongs: any[] = [];
    
    try {
      // בגרסאות חדשות של youtubei יש פונקציה שמביאה את כל השירים של האמן
      if ((artist as any).getAllSongs) {
        const fullSongsList = await (artist as any).getAllSongs();
        allTopSongs = fullSongsList.contents || (fullSongsList as any) || [];
      }
    } catch (e) {
      console.log("Could not fetch ALL songs directly, falling back to shelf preview");
    }

    // אם הפונקציה לא הצליחה, ניקח לפחות את אלו שמוצגים במדף
    if (allTopSongs.length === 0) {
      const topSongsSection = artist.sections?.find((s: any) => s.type === 'MusicShelf' && (s.title?.toString() === 'Top songs' || s.header?.title?.toString() === 'Top songs'));
      if (topSongsSection && topSongsSection.contents) {
        allTopSongs = topSongsSection.contents;
      }
    }

    if (allTopSongs.length > 0) {
      const topSongs = allTopSongs.map((item: any) => {
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const thumbUrl = thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null;
        
        return {
          youtube_id: item.id || item.videoId,
          title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString(),
          thumbnail_url: thumbUrl,
          duration: 0,
          artist_id: dbArtistId,
        };
      }).filter((s: any) => s.youtube_id && s.title);

      if (topSongs.length > 0) {
        await supabase.from('songs').upsert(topSongs as any, { onConflict: 'youtube_id', ignoreDuplicates: true });
        totalSongsAdded += topSongs.length;
      }
    }

    // NEW: 2.5 Extract Videos (Music Videos, Live performances)
    const videosSection = artist.sections?.find((s: any) => 
      s.type === 'MusicCarouselShelf' && 
      s.header?.title?.toString() === 'Videos'
    );
    
    if (videosSection && (videosSection as any).contents) {
      const videos = (videosSection as any).contents.map((item: any) => {
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const thumbUrl = thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null;
        
        return {
          youtube_id: item.id || item.videoId,
          title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString() || 'Unknown Title',
          thumbnail_url: thumbUrl,
          duration: 0,
          artist_id: dbArtistId,
        };
      }).filter((s: any) => s.youtube_id);

      if (videos.length > 0) {
        // נוסיף את הוידאו ישירות כ"שירים" של האמן
        const { data: insertedVideos, error: vidErr } = await supabase
          .from('songs')
          .upsert(videos as any, { onConflict: 'youtube_id', ignoreDuplicates: true })
          .select();
        
        if (!vidErr && insertedVideos) {
          totalSongsAdded += insertedVideos.length;
        }
      }
    }

    // 3. Extract Albums and Singles
    const albumSections = artist.sections?.filter((s: any) => 
      s.type === 'MusicCarouselShelf' && 
      (s.header?.title?.toString() === 'Albums' || s.header?.title?.toString() === 'Singles')
    ) || [];

    for (const section of albumSections) {
      const sectionType = (section as any).header?.title?.toString() === 'Albums' ? 'album' : 'single';
      const contents = (section as any).contents || [];

      for (const item of contents) {
        if (!item.id) continue;
        
        // Find highest res thumbnail
        const thumbs = item.thumbnail || [];
        const thumbUrl = thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null;
        const releaseYear = item.year ? parseInt(item.year, 10) : null;
        const albumTitle = Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString();
        
        // Upsert Album
        const { data: albumRow, error: albumError } = await supabase
          .from('playlists')
          .upsert({
            youtube_id: item.id,
            title: albumTitle || 'Unknown Album',
            type: sectionType,
            release_year: releaseYear,
            thumbnail_url: thumbUrl,
            artist_id: dbArtistId
          } as any, { onConflict: 'youtube_id' })
          .select()
          .single();

        if (albumError || !albumRow) {
          console.error('Failed to upsert album:', albumError);
          continue;
        }
        totalAlbumsAdded++;

        // Fetch Album details (Songs)
        try {
          const albumDetails = await yt.music.getAlbum(item.id);
          if (albumDetails && albumDetails.contents) {
            const albumSongs = albumDetails.contents.map((songItem: any, index: number) => {
              const sThumbs = songItem.thumbnail?.contents || [];
              const sThumbUrl = sThumbs.length > 0 ? upscaleThumbnail(sThumbs[sThumbs.length - 1].url) : thumbUrl;
              return {
                youtube_id: songItem.id,
                title: songItem.title,
                thumbnail_url: sThumbUrl,
                artist_id: dbArtistId,
                album_id: (albumRow as any).id
              };
            }).filter((s: any) => s.youtube_id);

            if (albumSongs.length > 0) {
              const { data: insertedSongs, error: songErr } = await supabase
                .from('songs')
                .upsert(albumSongs as any, { onConflict: 'youtube_id' })
                .select();
                
              if (!songErr && insertedSongs) {
                totalSongsAdded += insertedSongs.length;
                
                // Link to playlist_songs
                const playlistSongs = insertedSongs.map((song: any, idx: number) => ({
                  playlist_id: (albumRow as any).id,
                  song_id: song.id,
                  position: idx + 1
                }));
                
                await supabase.from('playlist_songs').upsert(playlistSongs as any, { onConflict: 'playlist_id,song_id', ignoreDuplicates: true });
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching album ${item.id}:`, err);
        }
      }
    }

    // Update last_updated
    await (supabase.from('artists') as any).update({
      last_updated: new Date().toISOString()
    }).eq('id', dbArtistId);

    return NextResponse.json({
      success: true,
      message: `Artist imported successfully! Added ${totalAlbumsAdded} albums/singles and ${totalSongsAdded} songs.`,
      artistName
    });

  } catch (error: any) {
    console.error('Import Artist API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
