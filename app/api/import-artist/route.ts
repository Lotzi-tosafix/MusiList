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
    const body = await req.json();
    const artistId = body.artistId;
    const regularChannelId = body.regularChannelId;

    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
    }

    const yt = await Innertube.create({ lang: 'en' });
    
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

    // 2. משיכת *כל* השירים הרשמיים (Official Audio)
    try {
      let allTopSongs: any[] = [];
      if ((artist as any).getAllSongs) {
        const fullSongsList = await (artist as any).getAllSongs();
        // תיקון: חיפוש תחת items בנוסף ל-contents
        allTopSongs = fullSongsList.items || fullSongsList.contents || (Array.isArray(fullSongsList) ? fullSongsList : []);
      }

      if (allTopSongs.length === 0) {
        const topSongsSection = artist.sections?.find((s: any) => s.type === 'MusicShelf' && (s.title?.toString() === 'Top songs' || s.header?.title?.toString() === 'Top songs'));
        if (topSongsSection) allTopSongs = (topSongsSection as any).contents || [];
      }

      const topSongs = allTopSongs.map((item: any) => {
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const ytid = item.id || item.videoId || (item.endpoint?.payload?.videoId);
        return {
          youtube_id: ytid,
          title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString() || 'Unknown Title',
          thumbnail_url: thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null,
          artist_id: dbArtistId,
          item_type: 'song'
        };
      }).filter((s: any) => s.youtube_id && s.title);

      if (topSongs.length > 0) {
        await supabase.from('songs').upsert(topSongs as any, { onConflict: 'youtube_id', ignoreDuplicates: true });
        totalSongsAdded += topSongs.length;
      }
    } catch (e) {
      console.log("Error fetching all songs:", e);
    }

    // 3. משיכת *כל* הקליפים (Videos)
    const videosSection = artist.sections?.find((s: any) => 
      s.type === 'MusicCarouselShelf' && (s.header?.title?.toString() === 'Videos' || s.header?.title?.toString() === 'Music videos' || s.title?.toString() === 'Videos')
    );
    
    if (videosSection) {
      let videosToInsert: any[] = [];
      const moreEndpoint = (videosSection as any).header?.more_content;
      
      if (moreEndpoint && moreEndpoint.endpoint?.payload?.browseId) {
        try {
          const playlistId = moreEndpoint.endpoint.payload.browseId;
          const playlist = await yt.music.getPlaylist(playlistId);
          videosToInsert = playlist.items || playlist.contents || [];
        } catch(e) {
          videosToInsert = (videosSection as any).contents || [];
        }
      } else {
        videosToInsert = (videosSection as any).contents || [];
      }

      const formattedVideos = videosToInsert.map((item: any) => {
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const ytid = item.id || item.videoId || (item.endpoint?.payload?.videoId);
        return {
          youtube_id: ytid,
          title: Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString() || 'Unknown Title',
          thumbnail_url: thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null,
          artist_id: dbArtistId,
          item_type: 'video'
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
        const plId = item.id || item.playlistId;
        if (!plId) continue;
        
        const thumbs = item.thumbnail?.contents || item.thumbnails || [];
        const thumbUrl = thumbs.length > 0 ? upscaleThumbnail(thumbs[thumbs.length - 1].url) : null;
        const releaseYear = item.year ? parseInt(item.year, 10) : null;
        const albumTitle = Array.isArray(item.title) ? item.title[0]?.text : item.title?.toString();
        
        const { data: albumRow } = await supabase.from('playlists').upsert({
          youtube_id: plId,
          title: albumTitle || 'Unknown Album',
          type: sectionType,
          release_year: releaseYear,
          thumbnail_url: thumbUrl,
          artist_id: dbArtistId
        } as any, { onConflict: 'youtube_id' }).select().single();

        if (albumRow) {
          totalAlbumsAdded++;
          try {
            const albumDetails = await yt.music.getAlbum(plId);
            if (albumDetails && albumDetails.contents) {
              const albumSongs = albumDetails.contents.map((songItem: any, index: number) => {
                const sThumbs = songItem.thumbnail?.contents || [];
                const ytid = songItem.id || songItem.videoId;
                return {
                  youtube_id: ytid,
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

    // 5. משיכת הפלייליסטים הרגילים מערוץ היוטיוב הרגיל של האמן
    try {
      let playlistsData: any = null;
      let channelIdToUse = regularChannelId || artistId;

      try {
        const channel = await yt.getChannel(channelIdToUse);
        playlistsData = await channel.getPlaylists();
      } catch (e) {
        if (!regularChannelId) {
          // Fallback: חיפוש הערוץ הרגיל ביוטיוב אם האמן הוא ערוץ נושא (Topic)
          const channelsSearch = await yt.search(artistName, { type: 'channel' });
          if (channelsSearch.channels && channelsSearch.channels.length > 0) {
            const bestChannelId = channelsSearch.channels[0].id || (channelsSearch.channels[0].author as any)?.channel_id;
            if (bestChannelId) {
              const channel = await yt.getChannel(bestChannelId);
              playlistsData = await channel.getPlaylists();
            }
          }
        }
      }

      if (playlistsData) {
        let regularPlaylists: any[] = [];
        
        // חיפוש חכם בכל השכבות של הערוץ כדי למצוא את הפלייליסטים
        if (playlistsData.playlists && Array.isArray(playlistsData.playlists)) {
          regularPlaylists.push(...playlistsData.playlists);
        }
        
        const tabContents = (playlistsData.current_tab?.content as any)?.contents || (playlistsData.current_tab as any)?.contents || [];
        for (const section of tabContents) {
          if (section.type === 'ItemSection' || section.type === 'SectionList') {
            const itemContents = section.contents;
            for (const item of itemContents) {
              if (item.type === 'Grid') {
                regularPlaylists.push(...(item.items || item.contents || []));
              } else if (item.type === 'Shelf' || item.type === 'ExpandedShelf') {
                regularPlaylists.push(...(item.content?.items || item.content?.contents || []));
              }
            }
          } else {
            if (section.contents && Array.isArray(section.contents)) regularPlaylists.push(...section.contents);
            if (section.items && Array.isArray(section.items)) regularPlaylists.push(...section.items);
          }
        }

        // Remove duplicate playlists by ID and extract properties correctly
        const playlistMap = new Map<string, { id: string; title: string; thumbUrl: string | null; raw: any }>();
        
        for (const pl of regularPlaylists) {
          let plId = pl.id || pl.playlist_id || pl.content_id;
          if (!plId && pl.endpoint?.payload?.playlistId) {
            plId = pl.endpoint.payload.playlistId;
          }
          if (!plId && pl.renderer_context?.command_context?.on_tap?.payload?.playlistId) {
            plId = pl.renderer_context.command_context.on_tap.payload.playlistId;
          }
          
          if (!plId || typeof plId !== 'string') continue;
          
          let plTitle = pl.title?.toString() || pl.metadata?.title?.toString();
          if (!plTitle && pl.metadata?.title?.text) {
            plTitle = pl.metadata.title.text;
          }
          if (!plTitle) {
            plTitle = 'Unknown Playlist';
          }
          
          let plThumb = null;
          if (pl.thumbnails && pl.thumbnails.length > 0) {
            plThumb = upscaleThumbnail(pl.thumbnails[pl.thumbnails.length - 1].url);
          } else if (pl.content_image?.primary_thumbnail?.image && pl.content_image.primary_thumbnail.image.length > 0) {
            const imgArray = pl.content_image.primary_thumbnail.image;
            plThumb = upscaleThumbnail(imgArray[imgArray.length - 1].url);
          }
          
          playlistMap.set(plId, {
            id: plId,
            title: plTitle,
            thumbUrl: plThumb,
            raw: pl
          });
        }
        
        const uniquePlaylists = Array.from(playlistMap.values());

        for (const plData of uniquePlaylists) {
          const plId = plData.id;
          const plTitle = plData.title;
          const thumbUrl = plData.thumbUrl;
          
          const { data: plRow } = await supabase.from('playlists').upsert({
            youtube_id: plId,
            title: plTitle,
            type: 'playlist',
            thumbnail_url: thumbUrl,
            artist_id: dbArtistId
          } as any, { onConflict: 'youtube_id' }).select().single();

          if (plRow) {
            totalPlaylistsAdded++;
            try {
              const plInfo = await yt.getPlaylist(plId);
              if (plInfo && plInfo.items) {
                 const plSongs = plInfo.items.map((songItem: any) => {
                   const sThumbs = songItem.thumbnails || [];
                   const ytid = songItem.id || songItem.videoId;
                   return {
                      youtube_id: ytid,
                      title: songItem.title?.toString(),
                      thumbnail_url: sThumbs.length > 0 ? upscaleThumbnail(sThumbs[sThumbs.length - 1].url) : thumbUrl,
                      artist_id: dbArtistId,
                      item_type: 'video'
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
      }
    } catch (e) {
      console.log("Could not fetch standard YouTube playlists", e);
    }

    await (supabase.from('artists') as any).update({ last_updated: new Date().toISOString() }).eq('id', dbArtistId);

    return NextResponse.json({
      success: true,
      message: `אמן יובא בהצלחה! נוספו: ${totalSongsAdded} שירים, ${totalVideosAdded} קליפים, ${totalAlbumsAdded} אלבומים ו-${totalPlaylistsAdded} פלייליסטים.`,
      artistName
    });

  } catch (error: any) {
    console.error('Import Artist API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
