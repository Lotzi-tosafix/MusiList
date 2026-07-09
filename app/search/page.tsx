"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon, Play, Music, ListVideo, User, Disc, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/lib/PlayerContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({
    songs: [] as any[],
    playlists: [] as any[],
    albums: [] as any[],
    artists: [] as any[]
  });
  const { playVideo, videos, currentIndex } = usePlayer();

  useEffect(() => {
    if (queryParam) {
      handleSearch(queryParam);
    } else {
      setResults({ songs: [], playlists: [], albums: [], artists: [] });
    }
  }, [queryParam]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], playlists: [], albums: [], artists: [] });
      return;
    }

    setIsSearching(true);
    
    try {
      const q = `%${searchQuery}%`;
      
      const [songsRes, playlistsRes, artistsRes] = await Promise.all([
        supabase.from('songs').select('*').ilike('title', q).limit(20),
        supabase.from('playlists').select('*, playlist_songs(songs(*))').ilike('title', q).limit(20),
        supabase.from('artists').select('*').ilike('name', q).limit(20)
      ]);

      const allPlaylists = (playlistsRes.data as any[]) || [];
      const albums = allPlaylists.filter(p => p.type === 'album' || p.type === 'single' || p.type === 'ep');
      const regularPlaylists = allPlaylists.filter(p => p.type !== 'album' && p.type !== 'single' && p.type !== 'ep');

      setResults({
        songs: songsRes.data || [],
        playlists: regularPlaylists,
        albums: albums,
        artists: artistsRes.data || []
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePlaySong = (song: any, contextQueue: any[]) => {
    const startIndex = contextQueue.findIndex(s => s.id === song.id);
    playVideo(`search-${queryParam}`, contextQueue, startIndex >= 0 ? startIndex : 0);
  };

  const hasResults = results.songs.length > 0 || results.playlists.length > 0 || results.albums.length > 0 || results.artists.length > 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <form onSubmit={onSubmit} className="mb-8 relative max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שירים, אמנים, אלבומים ופלייליסטים..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 text-lg"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
      </form>

      {queryParam && !isSearching && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === "all" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            הכל
          </button>
          <button
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === "songs" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            שירים
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === "artists" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            אמנים
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === "albums" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            אלבומים
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === "playlists" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            פלייליסטים
          </button>
        </div>
      )}

      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
          <p>מחפש תוצאות...</p>
        </div>
      ) : queryParam && !hasResults ? (
        <div className="text-center py-20">
          <p className="text-xl text-slate-600 dark:text-slate-400">
            לא נמצאו תוצאות עבור "{queryParam}"
          </p>
        </div>
      ) : hasResults && (
        <div className="space-y-12">
          {/* Artists */}
          {results.artists.length > 0 && (activeTab === "all" || activeTab === "artists") && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <User className="text-violet-500" /> אמנים
              </h2>
              <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
                {results.artists.map(artist => (
                  <Link href={`/artist/${artist.id}`} key={artist.id} className="group flex-shrink-0 w-32 flex flex-col items-center gap-2">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                      {artist.avatar_url ? (
                        <Image src={artist.avatar_url} alt={artist.name} fill className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">{artist.name[0]}</div>
                      )}
                    </div>
                    <h3 className="font-medium text-center line-clamp-1">{artist.name}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Songs */}
          {results.songs.length > 0 && (activeTab === "all" || activeTab === "songs") && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Music className="text-violet-500" /> שירים
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.songs.map(song => (
                  <div key={song.id} onClick={() => handlePlaySong(song, results.songs)} className="group cursor-pointer">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                      <Image src={song.thumbnail_url || "https://picsum.photos/seed/placeholder/640/360"} alt={song.title} fill className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{song.title}</h3>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {results.albums.length > 0 && (activeTab === "all" || activeTab === "albums") && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Disc className="text-violet-500" /> אלבומים
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.albums.map(album => (
                  <Link href={`/playlist/${album.id}`} key={album.id} className="group">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                      <Image src={album.thumbnail_url || "https://picsum.photos/seed/placeholder/640/360"} alt={album.title} fill className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{album.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {results.playlists.length > 0 && (activeTab === "all" || activeTab === "playlists") && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ListVideo className="text-violet-500" /> פלייליסטים
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.playlists.map(pl => (
                  <Link href={`/playlist/${pl.id}`} key={pl.id} className="group">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                      <Image src={pl.thumbnail_url || "https://picsum.photos/seed/placeholder/640/360"} alt={pl.title} fill className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{pl.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
