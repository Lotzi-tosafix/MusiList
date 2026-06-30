import { supabase } from './supabase';

export function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return null;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

export function extractChapters(description: string, videoId: string) {
  const chapters: any[] = [];
  const lines = description.split('\n');
  const timeRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)$/;
  
  for (const line of lines) {
    const match = line.trim().match(timeRegex);
    if (match) {
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      const title = match[4].trim();
      
      const startTime = hours * 3600 + minutes * 60 + seconds;
      chapters.push({ id: `${videoId}_${startTime}`, video_id: videoId, title, start_time: startTime });
    }
  }
  return chapters;
}

export async function syncChannelVideos(channelId: string, apiKey: string) {
  const uulfId = channelId.replace(/^UC/, 'UULF');
  let nextPageToken = '';
  let keepFetching = true;
  let newItemsToEnrich: any[] = [];
  let insertedCount = 0;
  
  while (keepFetching) {
      const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uulfId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
      const apiData = await apiRes.json();
      
      if (!apiData.items || apiData.items.length === 0) break;
      
      const fetchedIds = apiData.items.map((item: any) => item.contentDetails.videoId);
      
      const { data: existing } = await (supabase.from('videos') as any).select('id').in('id', fetchedIds);
      const existingIds = new Set((existing as any[])?.map(v => v.id) || []);
      
      for (const item of apiData.items) {
          const vId = item.contentDetails.videoId;
          if (existingIds.has(vId)) {
              keepFetching = false;
              break;
          }
          if (item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video') {
              newItemsToEnrich.push(item);
          }
      }
      
      nextPageToken = apiData.nextPageToken;
      if (!nextPageToken) keepFetching = false;
  }
  
  // Enrich in chunks of 50
  for (let i = 0; i < newItemsToEnrich.length; i += 50) {
      const chunk = newItemsToEnrich.slice(i, i + 50);
      const videoIds = chunk.map((item: any) => item.contentDetails.videoId).join(',');
      
      let videoStatsMap = new Map();
      let videoChapters: any[] = [];
      
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${apiKey}`);
      const statsData = await statsRes.json();
      if (statsData.items) {
          statsData.items.forEach((v: any) => {
               const duration = parseDuration(v.contentDetails.duration);
               videoStatsMap.set(v.id, {
                 duration,
                 viewCount: parseInt(v.statistics?.viewCount || '0', 10),
                 likeCount: parseInt(v.statistics?.likeCount || '0', 10),
                 description: v.snippet.description || ''
               });
               const chapters = extractChapters(v.snippet.description || '', v.id);
               videoChapters.push(...chapters);
          });
      }
      
      const videosToInsert = chunk.map((item: any) => {
          const videoId = item.contentDetails.videoId;
          const thumbnails = item.snippet.thumbnails || {};
          const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
          const stats = videoStatsMap.get(videoId) || {};
          
          return {
            id: videoId,
            channel_id: channelId,
            title: item.snippet.title,
            description: stats.description || item.snippet.description,
            thumbnail,
            duration: stats.duration || null,
            view_count: stats.viewCount || null,
            like_count: stats.likeCount || null,
            published_at: item.contentDetails.videoPublishedAt || item.snippet.publishedAt || new Date().toISOString()
          };
      });

      const { error: videosError } = await (supabase.from('videos') as any).upsert(videosToInsert, { onConflict: 'id' });
      if (videosError) {
          console.error('Error inserting videos:', videosError);
      } else {
          insertedCount += videosToInsert.length;
      }
      
      if (videoChapters.length > 0) {
         const { error: chaptersError } = await (supabase.from('video_chapters') as any).upsert(videoChapters, { onConflict: 'id' });
         if (chaptersError) console.error('Error inserting chapters:', chaptersError);
      }
  }
  
  return insertedCount;
}

export async function syncSinglePlaylistVideos(playlistId: string, channelId: string, apiKey: string) {
    let nextPageToken = '';
    let keepFetching = true;
    let newItemsToEnrich: any[] = [];
    let insertedCount = 0;
    
    while (keepFetching) {
        const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
        const apiData = await apiRes.json();
        
        if (!apiData.items || apiData.items.length === 0) break;
        
        const fetchedIds = apiData.items.map((item: any) => item.contentDetails.videoId);
        
        // Compare with playlist_items specifically
        const { data: existing } = await (supabase.from('playlist_items') as any).select('video_id').eq('playlist_id', playlistId).in('video_id', fetchedIds);
        const existingIds = new Set((existing as any[])?.map(v => v.video_id) || []);
        
        for (const item of apiData.items) {
            const vId = item.contentDetails.videoId;
            if (existingIds.has(vId)) {
                keepFetching = false;
                break;
            }
            if (item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video') {
                newItemsToEnrich.push(item);
            }
        }
        
        nextPageToken = apiData.nextPageToken;
        if (!nextPageToken) keepFetching = false;
    }

    if (newItemsToEnrich.length === 0) {
        await (supabase.from('playlists') as any).update({ last_sync_at: new Date().toISOString() }).eq('id', playlistId);
        return 0;
    }
    
    // Check if these new videos are already in the `videos` table
    const allNewVideoIds = newItemsToEnrich.map(item => item.contentDetails.videoId);
    const { data: globalExisting } = await (supabase.from('videos') as any).select('id').in('id', allNewVideoIds);
    const globalExistingIds = new Set((globalExisting as any[])?.map(v => v.id) || []);

    const videosToFetch = newItemsToEnrich.filter(item => !globalExistingIds.has(item.contentDetails.videoId));

    // Enrich missing videos in chunks of 50
    for (let i = 0; i < videosToFetch.length; i += 50) {
        const chunk = videosToFetch.slice(i, i + 50);
        const videoIds = chunk.map((item: any) => item.contentDetails.videoId).join(',');
        
        let videoStatsMap = new Map();
        let videoChapters: any[] = [];
        
        const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${apiKey}`);
        const statsData = await statsRes.json();
        if (statsData.items) {
            statsData.items.forEach((v: any) => {
                 const duration = parseDuration(v.contentDetails.duration);
                 videoStatsMap.set(v.id, {
                   duration,
                   viewCount: parseInt(v.statistics?.viewCount || '0', 10),
                   likeCount: parseInt(v.statistics?.likeCount || '0', 10),
                   description: v.snippet.description || ''
                 });
                 const chapters = extractChapters(v.snippet.description || '', v.id);
                 videoChapters.push(...chapters);
            });
        }
        
        const videosToInsert = chunk.map((item: any) => {
            const videoId = item.contentDetails.videoId;
            const thumbnails = item.snippet.thumbnails || {};
            const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
            const stats = videoStatsMap.get(videoId) || {};
            
            return {
              id: videoId,
              channel_id: channelId,
              title: item.snippet.title,
              description: stats.description || item.snippet.description,
              thumbnail,
              duration: stats.duration || null,
              view_count: stats.viewCount || null,
              like_count: stats.likeCount || null,
              published_at: item.contentDetails.videoPublishedAt || item.snippet.publishedAt || new Date().toISOString()
            };
        });

        await (supabase.from('videos') as any).upsert(videosToInsert, { onConflict: 'id' });
        if (videoChapters.length > 0) {
           await (supabase.from('video_chapters') as any).upsert(videoChapters, { onConflict: 'id' });
        }
    }

    // Now insert ALL newItemsToEnrich into playlist_items
    const playlistItemsToInsert = newItemsToEnrich.map((item, index) => ({
        playlist_id: playlistId,
        video_id: item.contentDetails.videoId,
        position: item.snippet.position || index // YouTube API returns position
    }));

    const { error: piError } = await (supabase.from('playlist_items') as any).upsert(playlistItemsToInsert, { onConflict: 'playlist_id,video_id', ignoreDuplicates: true });
    
    if (!piError) {
        insertedCount = playlistItemsToInsert.length;
    }

    await (supabase.from('playlists') as any).update({ last_sync_at: new Date().toISOString() }).eq('id', playlistId);
    
    return insertedCount;
}
export async function syncChannelPlaylists(channelId: string, apiKey: string) {
    let playlistsNextPageToken = '';
    let keepFetchingPlaylists = true;
    const allPlaylists = [];
    let insertedCount = 0;
    
    while(keepFetchingPlaylists) {
        const playlistsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&maxResults=50&channelId=${channelId}&key=${apiKey}${playlistsNextPageToken ? `&pageToken=${playlistsNextPageToken}` : ''}`);
        const playlistsData = await playlistsRes.json();
        
        if (playlistsData.items && playlistsData.items.length > 0) {
            const playlistsToInsert = playlistsData.items.map((item: any) => {
                const thumbnails = item.snippet.thumbnails || {};
                const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || null;
                return {
                    id: item.id,
                    channel_id: channelId,
                    title: item.snippet.title,
                    thumbnail: thumbnail,
                };
            });
            allPlaylists.push(...playlistsToInsert);
        }
        
        playlistsNextPageToken = playlistsData.nextPageToken;
        if (!playlistsNextPageToken) keepFetchingPlaylists = false;
    }
    
    if (allPlaylists.length > 0) {
        const { error } = await (supabase.from('playlists') as any).upsert(allPlaylists, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) {
             insertedCount = allPlaylists.length;
        }
    }
    return insertedCount;
}
