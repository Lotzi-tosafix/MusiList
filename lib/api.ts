import { supabase } from "./supabase";
import { Database } from "./database.types";

export type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
export type SongRow = Database["public"]["Tables"]["songs"]["Row"];
export type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];

export type PlaylistWithSongs = PlaylistRow & {
  songs: (SongRow & { position: number })[];
  artist?: ArtistRow;
};

export async function getTrendingPlaylists(): Promise<PlaylistWithSongs[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select(`
      *,
      artist:artists (*),
      playlist_songs (
        position,
        songs (*)
      )
    `)
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
    return { ...pl, songs, artist: pl.artist };
  }) as PlaylistWithSongs[];
}

export async function getRecentAlbums(): Promise<PlaylistWithSongs[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select(`
      *,
      artist:artists (*),
      playlist_songs (
        position,
        songs (*)
      )
    `)
    .eq('type', 'album')
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching recent albums:", error);
    return [];
  }

  const playlists = data as any[];
  return playlists.map((pl) => {
    const songs = (pl.playlist_songs || [])
      .map((ps: any) => ({ ...ps.songs, position: ps.position }))
      .sort((a: any, b: any) => a.position - b.position);
    return { ...pl, songs, artist: pl.artist };
  }) as PlaylistWithSongs[];
}

export async function getTopArtists(): Promise<ArtistRow[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching artists:", error);
    return [];
  }

  return data as ArtistRow[];
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

export async function getPlaylistById(
  id: string,
): Promise<PlaylistWithSongs | null> {
  const { data, error } = await supabase
    .from("playlists")
    .select(`
      *,
      artist:artists (*),
      playlist_songs (
        position,
        songs (*)
      )
    `)
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
  return { ...pl, songs, artist: pl.artist } as PlaylistWithSongs;
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
