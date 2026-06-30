import { supabase } from './supabase';
import { Database } from './database.types';

export type ChannelRow = Database['public']['Tables']['channels']['Row'];
export type VideoRow = Database['public']['Tables']['videos']['Row'];
export type PlaylistRow = Database['public']['Tables']['playlists']['Row'];
export type ChapterRow = Database['public']['Tables']['video_chapters']['Row'];

export type VideoWithChannel = VideoRow & { channel: ChannelRow };
export type PlaylistWithChannel = PlaylistRow & { channel: ChannelRow };
export type VideoWithChapters = VideoRow & { chapters: ChapterRow[] };

export async function getChannels(): Promise<ChannelRow[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
  return data as ChannelRow[];
}

export async function getRecentVideos(limit = 20): Promise<VideoWithChannel[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      channel:channels (*)
    `)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent videos:', error);
    return [];
  }

  return data as any as VideoWithChannel[];
}

export async function getChannelById(id: string): Promise<ChannelRow | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ChannelRow;
}

export async function getChannelVideos(channelId: string): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('channel_id', channelId)
    .order('published_at', { ascending: false });

  if (error) return [];
  return data as VideoRow[];
}

export async function getChannelPlaylists(channelId: string): Promise<PlaylistRow[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('channel_id', channelId)
    .order('title', { ascending: true });

  if (error) return [];
  return data as PlaylistRow[];
}

export async function getPlaylistById(id: string): Promise<PlaylistRow | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as PlaylistRow;
}

export async function getPlaylistItems(playlistId: string): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from('playlist_items')
    .select(`
      position,
      video:videos(*)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error || !data) return [];
  // Filter out any missing videos and map to VideoRow
  return data.map((item: any) => item.video).filter(Boolean) as VideoRow[];
}

export async function searchVideos(query: string): Promise<VideoWithChannel[]> {
  // Assuming basic ilike search, for full text search you would use .textSearch
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      channel:channels (*)
    `)
    .ilike('title', `%${query}%`)
    .limit(30);

  if (error) return [];
  return data as any as VideoWithChannel[];
}

