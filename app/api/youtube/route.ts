import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Parser from 'rss-parser';

const parser = new Parser();

function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const apiKey = process.env.YOUTUBE_API_KEY;
    const db = supabase as any;
    if (!apiKey && action === 'import_channel') {
      return NextResponse.json({ error: 'מפתח API של יוטיוב חסר' }, { status: 500 });
    }

    if (action === 'record_play') {
      const { songId } = body;
      if (!songId) return NextResponse.json({ error: 'Missing songId' }, { status: 400 });
      // We can use a stored procedure or just update (Supabase allows direct updates but concurrent increments require RPC, we'll use a simple approach for now)
      const { data: song } = await db.from('songs').select('play_count').eq('id', songId).single();
      if (song) {
        await db.from('songs').update({ play_count: Number(song.play_count || 0) + 1 }).eq('id', songId);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'record_playlist_play') {
      const { playlistId } = body;
      if (!playlistId) return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 });
      const { data: pl } = await db.from('playlists').select('play_count').eq('id', playlistId).single();
      if (pl) {
        await db.from('playlists').update({ play_count: Number(pl.play_count || 0) + 1 }).eq('id', playlistId);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'import_channel') {
      const { channelId: rawChannelId } = body;
      if (!rawChannelId) return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });

      // Extract YouTube channel ID or handle from full URLs
      const trimmed = rawChannelId.trim();
      let parsedId = '';
      let parsedHandle = '';

      const cleanIdMatch = trimmed.match(/^(UC[a-zA-Z0-9_-]{22})$/);
      if (cleanIdMatch) {
        parsedId = cleanIdMatch[1];
      } else {
        const channelUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
        if (channelUrlMatch) {
          parsedId = channelUrlMatch[1];
        } else {
          const cleanHandleMatch = trimmed.match(/^(@[a-zA-Z0-9._-]+)$/);
          if (cleanHandleMatch) {
            parsedHandle = cleanHandleMatch[1];
          } else {
            const handleUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(@[a-zA-Z0-9._-]+)/i);
            if (handleUrlMatch) {
              parsedHandle = handleUrlMatch[1];
            } else if (trimmed.startsWith('UC')) {
              parsedId = trimmed;
            } else if (trimmed.startsWith('@')) {
              parsedHandle = trimmed;
            }
          }
        }
      }

      let fetchUrl = '';
      if (parsedId) {
        fetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${parsedId}&key=${apiKey}`;
      } else if (parsedHandle) {
        fetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(parsedHandle)}&key=${apiKey}`;
      } else {
        return NextResponse.json({ error: 'מזהה ערוץ או קישור לא תקין' }, { status: 400 });
      }

      // 1. Get channel details
      const channelRes = await fetch(fetchUrl);
      const channelData = await channelRes.json();
      if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json({ error: 'הערוץ לא נמצא. אנא ודא שהקישור או המזהה נכונים.' }, { status: 404 });
      }
      
      const realChannelId = channelData.items[0].id;
      const channelTitle = channelData.items[0].snippet.title;

      // Upsert channel
      const { data: channelRow, error: chError } = await db
        .from('channels')
        .upsert({ youtube_id: realChannelId, title: channelTitle })
        .select()
        .single();
         
      if (chError || !channelRow) {
        throw chError || new Error('Failed to upsert channel');
      }

      const dbChannelId = channelRow.id;
      const uulfPlaylistId = realChannelId.replace('UC', 'UULF');
      
      // 2. Fetch UULF playlist for songs
      let pageToken = '';
      let keepFetching = true;
      let newSongsCount = 0;

      while (keepFetching) {
        const uulfRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uulfPlaylistId}&pageToken=${pageToken}&key=${apiKey}`);
        const uulfData = await uulfRes.json();

        if (!uulfData.items || uulfData.items.length === 0) break;

        const videoIds = uulfData.items.map((i: any) => i.contentDetails.videoId);
        
        // Check which videos already exist
        const { data: existingSongs } = await db.from('songs').select('youtube_id').in('youtube_id', videoIds);
        const existingSet = new Set(existingSongs?.map((s: any) => s.youtube_id) || []);

        const newVideoIds = videoIds.filter((id: string) => !existingSet.has(id));
        
        if (newVideoIds.length === 0) {
          // All videos on this page exist, stop fetching older ones
          keepFetching = false;
          break;
        }

        // Fetch duration and statistics for new videos
        const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${newVideoIds.join(',')}&key=${apiKey}`);
        const vidData = await vidRes.json();
        const durationMap: Record<string, number> = {};
        const likesMap: Record<string, number> = {};
        const viewsMap: Record<string, number> = {};
        if (vidData.items) {
          vidData.items.forEach((v: any) => {
            durationMap[v.id] = parseDuration(v.contentDetails.duration);
            likesMap[v.id] = v.statistics?.likeCount ? parseInt(v.statistics.likeCount, 10) : 0;
            viewsMap[v.id] = v.statistics?.viewCount ? parseInt(v.statistics.viewCount, 10) : 0;
          });
        }

        const songsToInsert = uulfData.items
          .filter((i: any) => newVideoIds.includes(i.contentDetails.videoId))
          .filter((i: any) => {
            const dur = durationMap[i.contentDetails.videoId] || 0;
            return dur >= 60; // Filter out shorts (< 60s) just in case UULF includes them
          })
          .map((i: any) => {
            const thumbnails = i.snippet.thumbnails || {};
            const thumb = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
            return {
              youtube_id: i.contentDetails.videoId,
              title: i.snippet.title,
              thumbnail_url: thumb,
              duration: durationMap[i.contentDetails.videoId] || 0,
              channel_id: dbChannelId,
              published_at: i.contentDetails.videoPublishedAt || i.snippet.publishedAt || new Date().toISOString(),
              play_count: viewsMap[i.contentDetails.videoId] || 0,
              likes_count: likesMap[i.contentDetails.videoId] || 0
            };
          });

        if (songsToInsert.length > 0) {
          await db.from('songs').insert(songsToInsert);
          newSongsCount += songsToInsert.length;
        }

        // If not all 50 were new, it means we hit old ones, we can stop
        if (newVideoIds.length < uulfData.items.length) {
          keepFetching = false;
        } else {
          pageToken = uulfData.nextPageToken || '';
          if (!pageToken) keepFetching = false;
        }
      }

      // 3. Fetch playlists
      pageToken = '';
      keepFetching = true;
      let newPlaylistsCount = 0;

      while (keepFetching) {
        const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${realChannelId}&maxResults=50&pageToken=${pageToken}&key=${apiKey}`);
        const plData = await plRes.json();

        if (!plData.items || plData.items.length === 0) break;

        for (const item of plData.items) {
          const thumbnails = item.snippet.thumbnails || {};
          const thumb = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
          
          const { data: plDataUpsert, error: plUpsertError } = await db.from('playlists').upsert({
            youtube_id: item.id,
            title: `${item.snippet.title} - ${channelTitle}`,
            description: item.snippet.description,
            thumbnail_url: thumb,
            channel_id: dbChannelId
          }, { onConflict: 'youtube_id' }).select().single();
          
          if (!plUpsertError && plDataUpsert) {
            newPlaylistsCount++;
            
            // Fetch playlist items for this playlist
            let plItemPage = '';
            let plKeep = true;
            let pos = 1;
            while (plKeep) {
               const plItemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${item.id}&pageToken=${plItemPage}&key=${apiKey}`);
               const plItemsData = await plItemsRes.json();
               if (!plItemsData.items || plItemsData.items.length === 0) break;
               
               const videoIds = plItemsData.items.map((i: any) => i.contentDetails.videoId);
               const { data: existingSongsPl } = await db.from('songs').select('id, youtube_id').in('youtube_id', videoIds);
               
               if (existingSongsPl && existingSongsPl.length > 0) {
                 const inserts = plItemsData.items.map((i: any) => {
                    const found = existingSongsPl.find((s: any) => s.youtube_id === i.contentDetails.videoId);
                    if (found) {
                      const plSong = { playlist_id: plDataUpsert.id, song_id: found.id, position: pos };
                      pos++;
                      return plSong;
                    }
                    return null;
                 }).filter((x: any) => x !== null);
                 
                 if (inserts.length > 0) {
                   await db.from('playlist_songs').upsert(inserts, { onConflict: 'playlist_id,song_id', ignoreDuplicates: true });
                 }
               }

               plItemPage = plItemsData.nextPageToken || '';
               if (!plItemPage) plKeep = false;
            }
          }
        }

        pageToken = plData.nextPageToken || '';
        if (!pageToken) keepFetching = false;
      }

      // Update channel sync times
      await db.from('channels').update({
        songs_last_updated: new Date().toISOString(),
        playlists_last_updated: new Date().toISOString()
      }).eq('id', dbChannelId);

      return NextResponse.json({ 
        success: true, 
        message: `Channel imported. Added ${newSongsCount} songs and processed ${newPlaylistsCount} playlists.` 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
