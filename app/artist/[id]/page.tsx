import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import SongCarousel from "@/components/SongCarousel";
import PlaylistCarousel from "@/components/PlaylistCarousel";

export const dynamic = "force-dynamic";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch artist
  const { data: rawArtist, error: artistError } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  const artist = rawArtist as any;

  if (artistError || !artist) {
    notFound();
  }

  // 2. Fetch artist top songs
  const { data: topSongs } = await supabase
    .from("songs")
    .select("*")
    .eq("artist_id", id)
    .order("play_count", { ascending: false })
    .limit(10);

  // 3. Fetch artist albums & singles
  const { data: releases } = await supabase
    .from("playlists")
    .select(`
      *,
      artist:artists (*),
      playlist_songs (
        position,
        songs (*)
      )
    `)
    .eq("artist_id", id)
    .order("release_year", { ascending: false });

  const playlists = (releases || []).map((pl: any) => {
    const songs = (pl.playlist_songs || [])
      .map((ps: any) => ({ ...ps.songs, position: ps.position }))
      .sort((a: any, b: any) => a.position - b.position);
    return { ...pl, songs, artist: pl.artist };
  });

  const albums = playlists.filter((p) => p.type === 'album');
  const singles = playlists.filter((p) => p.type === 'single' || p.type === 'ep');

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-muted">
        {artist.banner_url || artist.avatar_url ? (
          <Image
            src={artist.banner_url || artist.avatar_url!}
            alt={artist.name}
            fill
            className="object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 flex items-end gap-6">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-background bg-muted">
             {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
          </div>
          <div className="mb-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white shadow-sm">
              {artist.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {/* Top Songs */}
        {topSongs && topSongs.length > 0 && (
          <SongCarousel
            songs={topSongs}
            title="שירים מובילים"
            type="trending"
          />
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <PlaylistCarousel
            playlists={albums}
            title="אלבומים"
            type="recent"
            viewAllHref={`/search?q=${encodeURIComponent(artist.name)}`}
          />
        )}

        {/* Singles & EPs */}
        {singles.length > 0 && (
          <PlaylistCarousel
            playlists={singles}
            title="סינגלים ו-EPs"
            type="recent"
            viewAllHref={`/search?q=${encodeURIComponent(artist.name)}`}
          />
        )}
      </div>
    </div>
  );
}
