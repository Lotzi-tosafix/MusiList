import { supabase } from './supabase';
import { Database } from './database.types';

export type PlaylistRow = Database['public']['Tables']['playlists']['Row'];
export type VideoRow = Database['public']['Tables']['videos']['Row'];

export type PlaylistWithVideos = PlaylistRow & {
  videos: VideoRow[];
};

export async function getTrendingPlaylists(): Promise<PlaylistWithVideos[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      videos (*)
    `)
    .eq('is_public', true)
    .order('play_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching trending playlists:', error);
    return [];
  }

  // Ensure videos are sorted by position
  const playlists = data as any[];
  return playlists.map(pl => ({
    ...pl,
    videos: (pl.videos || []).sort((a: VideoRow, b: VideoRow) => a.position - b.position)
  })) as PlaylistWithVideos[];
}

export async function getRecentPlaylists(): Promise<PlaylistWithVideos[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      videos (*)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent playlists:', error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map(pl => ({
    ...pl,
    videos: (pl.videos || []).sort((a: VideoRow, b: VideoRow) => a.position - b.position)
  })) as PlaylistWithVideos[];
}

export async function getPlaylists(sortBy: 'created_at' | 'play_count'): Promise<PlaylistWithVideos[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      videos (*)
    `)
    .eq('is_public', true)
    .order(sortBy, { ascending: false });

  if (error) {
    console.error(`Error fetching playlists sorted by ${sortBy}:`, error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map(pl => ({
    ...pl,
    videos: (pl.videos || []).sort((a: VideoRow, b: VideoRow) => a.position - b.position)
  })) as PlaylistWithVideos[];
}

export async function getPlaylistById(id: string): Promise<PlaylistWithVideos | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      videos (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching playlist:', error);
    return null;
  }

  const pl = data as any;
  return {
    ...pl,
    videos: (pl.videos || []).sort((a: VideoRow, b: VideoRow) => a.position - b.position)
  } as PlaylistWithVideos;
}

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('tags')
    .eq('is_public', true);

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  const tagSet = new Set<string>();
  (data as any[]).forEach(row => {
    if (row.tags) {
      row.tags.forEach((tag: string) => tagSet.add(tag));
    }
  });

  return Array.from(tagSet);
}
