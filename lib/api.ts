import { supabase } from "./supabase";
import { Database } from "./database.types";

export type ChannelRow = Database["public"]["Tables"]["channels"]["Row"];
export type SongRow = Database["public"]["Tables"]["songs"]["Row"];
export type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];

export type PlaylistWithSongs = PlaylistRow & {
  songs: (SongRow & { position: number })[];
};

export async function getTrendingPlaylists(): Promise<PlaylistWithSongs[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select(
      `
      *,
      playlist_songs (
        position,
        songs (*)
      )
    `,
    )
    .order("play_count", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching trending playlists:", error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map((pl) => {
    const songs = (pl.playlist_songs || [])
      .map((ps: any) => ({ ...ps.songs, position: ps.position }))
      .sort((a: any, b: any) => a.position - b.position);
    return { ...pl, songs };
  }) as PlaylistWithSongs[];
}

export async function getRecentPlaylists(): Promise<PlaylistWithSongs[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select(
      `
      *,
      playlist_songs (
        position,
        songs (*)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching recent playlists:", error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map((pl) => {
    const songs = (pl.playlist_songs || [])
      .map((ps: any) => ({ ...ps.songs, position: ps.position }))
      .sort((a: any, b: any) => a.position - b.position);
    return { ...pl, songs };
  }) as PlaylistWithSongs[];
}

export async function getPlaylists(
  sortBy: "created_at" | "play_count",
): Promise<PlaylistWithSongs[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select(
      `
      *,
      playlist_songs (
        position,
        songs (*)
      )
    `,
    )
    .order(sortBy, { ascending: false });

  if (error) {
    console.error(`Error fetching playlists sorted by ${sortBy}:`, error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map((pl) => {
    const songs = (pl.playlist_songs || [])
      .map((ps: any) => ({ ...ps.songs, position: ps.position }))
      .sort((a: any, b: any) => a.position - b.position);
    return { ...pl, songs };
  }) as PlaylistWithSongs[];
}

export async function getPlaylistById(
  id: string,
): Promise<PlaylistWithSongs | null> {
  const { data, error } = await supabase
    .from("playlists")
    .select(
      `
      *,
      playlist_songs (
        position,
        songs (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching playlist:", error);
    return null;
  }

  const pl = data as any;
  const songs = (pl.playlist_songs || [])
    .map((ps: any) => ({ ...ps.songs, position: ps.position }))
    .sort((a: any, b: any) => a.position - b.position);

  return { ...pl, songs } as PlaylistWithSongs;
}

export async function getTrendingSongs(): Promise<SongRow[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("play_count", { ascending: false })
    .limit(15);

  if (error) {
    console.error("Error fetching trending songs:", error);
    return [];
  }
  return data as SongRow[];
}

export async function getRecentSongs(): Promise<SongRow[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(15);

  if (error) {
    console.error("Error fetching recent songs:", error);
    return [];
  }
  return data as SongRow[];
}

export async function getAllTags(): Promise<string[]> {
  // Tags were removed from the schema, returning empty array for now
  return [];
}
