import { supabase } from './supabase';
import { VideoWithChannel, PlaylistWithChannel, ChannelRow, PlaylistRow, VideoRow } from './api';

export interface PlayLog {
  v: string; // video ID
  p: string | null; // playlist ID
  t: number; // timestamp ms
}

// Helper to fetch and parse the play logs from the system video row
export async function getPlayLogs(): Promise<PlayLog[]> {
  try {
    const { data, error } = await (supabase.from('videos') as any)
      .select('description')
      .eq('id', '_plays_log')
      .single();

    if (error || !data || !(data as any).description) {
      return [];
    }

    const logs: PlayLog[] = JSON.parse((data as any).description);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Filter to only include last 7 days logs
    return logs.filter(log => log && log.t && log.t > oneWeekAgo);
  } catch (err) {
    console.error('Error fetching/parsing play logs:', err);
    return [];
  }
}

// Fetch hot songs based on logs in last 7 days, fallback to most viewed
export async function getHotSongs(limit = 20): Promise<VideoWithChannel[]> {
  const logs = await getPlayLogs();
  
  // Count frequency of each video ID
  const counts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.v) {
      counts[log.v] = (counts[log.v] || 0) + 1;
    }
  });

  // Sort video IDs by count descending
  const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  let hotVideos: VideoWithChannel[] = [];

  if (sortedIds.length > 0) {
    // Fetch details for these videos
    const { data, error } = await (supabase.from('videos') as any)
      .select('*, channel:channels(*)')
      .in('id', sortedIds.slice(0, limit));

    if (!error && data) {
      // Sort retrieved videos according to original frequency rank
      const videoMap = new Map<string, any>();
      (data as any[]).forEach((v: any) => videoMap.set(v.id, v));

      hotVideos = sortedIds
        .map(id => videoMap.get(id))
        .filter(Boolean) as VideoWithChannel[];
    }
  }

  // Fallback / padding with most viewed videos if we don't have enough hot videos
  if (hotVideos.length < limit) {
    const needed = limit - hotVideos.length;
    const excludeIds = hotVideos.map(v => v.id);
    
    let query = (supabase.from('videos') as any)
      .select('*, channel:channels(*)')
      .order('view_count', { ascending: false })
      .limit(needed);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: fallbackData, error } = await query;
    if (!error && fallbackData) {
      hotVideos = [...hotVideos, ...(fallbackData as any as VideoWithChannel[])];
    }
  }

  return hotVideos;
}

// Fetch hot playlists based on logs in last 7 days (at least 3 songs played), fallback to synced
export async function getHotPlaylists(limit = 20): Promise<PlaylistWithChannel[]> {
  const logs = await getPlayLogs();

  // Group log items by playlist ID and gather set of unique videos played from it
  const playlistSongSets: Record<string, Set<string>> = {};
  logs.forEach(log => {
    if (log.p) {
      if (!playlistSongSets[log.p]) {
        playlistSongSets[log.p] = new Set();
      }
      playlistSongSets[log.p].add(log.v);
    }
  });

  // Filter playlists where at least 3 unique songs were played
  const eligiblePlaylistIds = Object.keys(playlistSongSets).filter(pId => {
    return playlistSongSets[pId].size >= 3;
  });

  // If there are eligible playlists, rank them by total plays
  const playlistPlaysCounts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.p && eligiblePlaylistIds.includes(log.p)) {
      playlistPlaysCounts[log.p] = (playlistPlaysCounts[log.p] || 0) + 1;
    }
  });

  const sortedPlaylistIds = eligiblePlaylistIds.sort((a, b) => {
    return (playlistPlaysCounts[b] || 0) - (playlistPlaysCounts[a] || 0);
  });

  let hotPlaylists: PlaylistWithChannel[] = [];

  if (sortedPlaylistIds.length > 0) {
    const { data, error } = await (supabase.from('playlists') as any)
      .select('*, channel:channels(*)')
      .in('id', sortedPlaylistIds.slice(0, limit));

    if (!error && data) {
      const playlistMap = new Map<string, any>();
      (data as any[]).forEach((p: any) => playlistMap.set(p.id, p));

      hotPlaylists = sortedPlaylistIds
        .map(id => playlistMap.get(id))
        .filter(Boolean) as PlaylistWithChannel[];
    }
  }

  // Fallback / padding with recent synced playlists
  if (hotPlaylists.length < limit) {
    const needed = limit - hotPlaylists.length;
    const excludeIds = hotPlaylists.map(p => p.id);

    let query = (supabase.from('playlists') as any)
      .select('*, channel:channels(*)')
      .order('last_sync_at', { ascending: false })
      .limit(needed);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: fallbackData, error } = await query;
    if (!error && fallbackData) {
      hotPlaylists = [...hotPlaylists, ...(fallbackData as any as PlaylistWithChannel[])];
    }
  }

  return hotPlaylists;
}

// Fetch all playlists from all channels
export async function getAllPlaylists(): Promise<PlaylistWithChannel[]> {
  const { data, error } = await (supabase.from('playlists') as any)
    .select('*, channel:channels(*)')
    .order('last_sync_at', { ascending: false });

  if (error || !data) return [];
  return data as any as PlaylistWithChannel[];
}

// Fetch all videos from all channels
export async function getAllVideos(): Promise<VideoWithChannel[]> {
  const { data, error } = await (supabase.from('videos') as any)
    .select('*, channel:channels(*)')
    .order('published_at', { ascending: false });

  if (error || !data) return [];
  // Filter out system row
  return (data as any as VideoWithChannel[]).filter(v => v.id !== '_plays_log');
}
