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
    
    // 1. קריאה ליוטיוב מיוזיק
    const artist = await yt.music.getArtist(artistId);
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const artistName = artist.header?.title?.toString() || 'Unknown Artist';
    const description = (artist.header as any)?.description?.toString() || '';
    
    let avatarUrl = '';
    const thumbnails = (artist.header as any)?.thumbnail?.contents || [];
    if (thumbnails.length > 0) {
      avatarUrl = upscaleThumbnail(thumbnails[thumbnails.length - 1]?.url) || '';
    }

    // יצירה או עדכון אמן במסד הנתונים
    const { data: artistRow, error: artistError } = await (supabase.from('artists') as any)
      .upsert(
        { youtube_id: artistId, name: artistName, description, avatar_url: avatarUrl } as any,
        { onConflict: 'youtube_id' }
      )
      .select()
      .single();

    if (artistError || !artistRow) {
      throw artistError || new Error('Failed to upsert artist');
    }

    const dbArtistId = (artistRow as any).id;
    let totalSongsAdded = 0;
    let totalVideosAdded = 0;
    let totalAlbumsAdded = 0;
    let totalPlaylistsAdded = 0;

    // 2. משיכת כל השירים הרשמיים (Official Audio) כ-'song'
    try {
      if ((artist as any).getAllSongs) {
        const fullSongsList = await (artist as any).getAllSongs();
        const allTopSongs = fullSongsList.contents || (fullSongsList as any) || [];
        
        const topSongs = allTopSongs.map((item: any) => {
          const thumbs = item.thumbnail?.contents || item.thumbnails || [];
          return {
            youtube_id: item.id || item.videoId,
            title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString(),
            thumbnail_url: thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null,
            artist_id: dbArtistId,
            item_type: 'song' // זיהוי כאודיו
          };
        }).filter((s: any) => s.youtube_id && s.title);

        if (topSongs.length > 0) {
          await supabase.from('songs').upsert(topSongs as any, { onConflict: 'youtube_id', ignoreDuplicates: true });
          totalSongsAdded += topSongs.length;
        }
      }
    } catch (e) {
      console.log("Could not fetch ALL songs directly");
    }

    // 3. משיכת *כל* הקליפים (Videos) דרך לחיצה על כפתור "ראה הכל" במידה ויש
    const videosSection = artist.sections?.find((s: any) => 
      s.type === 'MusicCarouselShelf' && s.header?.title?.toString() === 'Videos'
    );
    
    if (videosSection) {
      let videosToInsert: any[] = [];
      
      // בדיקה אם יש כפתור "ראה הכל" (Endpoint לפלייליסט של כל הקליפים)
      const moreEndpoint = (videosSection as any).header?.more_content;
      if (moreEndpoint) {
        try {
          const videosPage = await moreEndpoint.call(yt.actions, { parse: true });
          const fullVideosList = videosPage.contents || [];
          videosToInsert = fullVideosList;
        } catch(e) {
          videosToInsert = (videosSection as any).contents || [];
        }
      } else {
        videosToInsert = (videosSection as any).contents || [];
      }

      const formattedVideos = videosToInsert.map((item: any) => {
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        return {
          youtube_id: item.id || item.videoId,
          title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString() || 'Unknown Title',
          thumbnail_url: thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null,
          artist_id: dbArtistId,
          item_type: 'video' // זיהוי כקליפ/וידאו
        };
      }).filter((s: any) => s.youtube_id);

      if (formattedVideos.length > 0) {
        await supabase.from('songs').upsert(formattedVideos as any, { onConflict: 'youtube_id', ignoreDuplicates: true });
        totalVideosAdded += formattedVideos.length;
      }
    }

    // 4. משיכת אלבומים וסינגלים (מיוטיוב מיוזיק)
    const albumSections = artist.sections?.filter((s: any) => 
      s.type === 'MusicCarouselShelf' && 
      (s.header?.title?.toString() === 'Albums' || s.header?.title?.toString() === 'Singles')
    ) || [];

    for (const section of albumSections) {
      const sectionType = (section as any).header?.title?.toString() === 'Albums' ? 'album' : 'single';
      const contents = (section as any).contents || [];

      for (const item of contents) {
        if (!item.id) continue;
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const thumbUrl = thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null;
        const releaseYear = item.year ? parseInt(item.year, 10) : null;
        const albumTitle = Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString();
        
        const { data: albumRow } = await supabase.from('playlists').upsert({
          youtube_id: item.id,
          title: albumTitle || 'Unknown Album',
          type: sectionType,
          release_year: releaseYear,
          thumbnail_url: thumbUrl,
          artist_id: dbArtistId
        } as any, { onConflict: 'youtube_id' }).select().single();

        if (albumRow) {
          totalAlbumsAdded++;
          try {
            const albumDetails = await yt.music.getAlbum(item.id);
            if (albumDetails && albumDetails.contents) {
              const albumSongs = albumDetails.contents.map((songItem: any, index: number) => {
                const sThumbs = songItem.thumbnail?.contents || [];
                return {
                  youtube_id: songItem.id || songItem.videoId,
                  title: songItem.title,
                  thumbnail_url: sThumbs.length > 0 ? upscaleThumbnail(sThumbs[sThumbs.length - 1].url) : thumbUrl,
                  artist_id: dbArtistId,
                  album_id: (albumRow as any).id,
                  item_type: 'song'
                };
              }).filter((s: any) => s.youtube_id);

              if (albumSongs.length > 0) {
                const { data: insertedSongs } = await supabase.from('songs').upsert(albumSongs as any, { onConflict: 'youtube_id' }).select();
                if (insertedSongs) {
                  const playlistSongs = insertedSongs.map((song: any, idx: number) => ({
                    playlist_id: (albumRow as any).id,
                    song_id: song.id,
                    position: idx + 1
                  }));
                  await supabase.from('playlist_songs').upsert(playlistSongs as any, { onConflict: 'playlist_id,song_id', ignoreDuplicates: true });
                }
              }
            }
          } catch (err) {}
        }
      }
    }

    // 5. קפיצה ליוטיוב הרגיל כדי למשוך את הפלייליסטים הרגילים!
    try {
      const channel = await yt.getChannel(artistId);
      const playlistsData = await channel.getPlaylists();
      
      const regularPlaylists = playlistsData.playlists || [];
      for (const pl of regularPlaylists) {
        const plAny = pl as any;
        const thumbUrl = plAny.thumbnails?.length > 0 ? upscaleThumbnail(plAny.thumbnails[plAny.thumbnails.length - 1].url) : null;
        
        // יצירת הפלייליסט תחת הסוג 'playlist'
        const { data: plRow } = await supabase.from('playlists').upsert({
          youtube_id: plAny.id,
          title: plAny.title?.toString() || 'Unknown Playlist',
          type: 'playlist',
          thumbnail_url: thumbUrl,
          artist_id: dbArtistId
        } as any, { onConflict: 'youtube_id' }).select().single();

        if (plRow) {
          totalPlaylistsAdded++;
          // נמשוך גם את התוכן של הפלייליסט הרגיל
          try {
            const plInfo = await yt.getPlaylist(plAny.id);
            if (plInfo && plInfo.items) {
               const plSongs = plInfo.items.map((songItem: any) => {
                 const sThumbs = songItem.thumbnails || [];
                 return {
                    youtube_id: songItem.id,
                    title: songItem.title?.toString(),
                    thumbnail_url: sThumbs.length > 0 ? upscaleThumbnail(sThumbs[sThumbs.length - 1].url) : thumbUrl,
                    artist_id: dbArtistId,
                    item_type: 'video' // פלייליסטים ביוטיוב רגיל לרוב מכילים קליפים
                 };
               }).filter((s: any) => s.youtube_id);

               if (plSongs.length > 0) {
                 const { data: insertedSongs } = await supabase.from('songs').upsert(plSongs as any, { onConflict: 'youtube_id' }).select();
                 if (insertedSongs) {
                   const playlistSongsRelations = insertedSongs.map((song: any, idx: number) => ({
                     playlist_id: (plRow as any).id,
                     song_id: song.id,
                     position: idx + 1
                   }));
                   await supabase.from('playlist_songs').upsert(playlistSongsRelations as any, { onConflict: 'playlist_id,song_id', ignoreDuplicates: true });
                 }
               }
            }
          } catch(err) {}
        }
      }
    } catch (e) {
      console.log("Could not fetch standard YouTube playlists", e);
    }

    await (supabase.from('artists') as any).update({ last_updated: new Date().toISOString() }).eq('id', dbArtistId);

    return NextResponse.json({
      success: true,
      message: `אמן יובא בהצלחה! נוספו: ${totalSongsAdded} שירים, ${totalVideosAdded} קליפים, ${totalAlbumsAdded} אלבומים/סינגלים ו-${totalPlaylistsAdded} פלייליסטים מיוטיוב.`,
      artistName
    });

  } catch (error: any) {
    console.error('Import Artist API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
