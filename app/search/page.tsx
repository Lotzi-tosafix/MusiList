"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Play,
  Search,
  ArrowRight,
  Music,
  Loader2,
  Heart,
  List,
  User,
  Radio,
} from "lucide-react";
import { PlaylistWithSongs } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/lib/PlayerContext";

export const dynamic = "force-dynamic";

export default function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const router = useRouter();
  const searchParams = use(props.searchParams);
  const initialQuery = searchParams.q || "";

  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [typedQuery, setTypedQuery] = useState(initialQuery);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setSearchQuery(initialQuery);
    setTypedQuery(initialQuery);
  }

  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "playlists" | "songs" | "channels">("all");

  const {
    playVideo,
    currentIndex,
    videos: playerQueue,
    isPlaying,
  } = usePlayer();

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery.trim()) {
        setPlaylists([]);
        setSongs([]);
        setChannels([]);
        return;
      }

      setLoading(true);
      const query = searchQuery.trim();

      try {
        // Search playlists
        const playlistsPromise = supabase
          .from("playlists")
          .select(`
            *,
            playlist_songs (
              position,
              songs (*)
            )
          `)
          .ilike("title", `%${query}%`)
          .order("play_count", { ascending: false });

        // Search songs
        const songsPromise = supabase
          .from("songs")
          .select("*")
          .ilike("title", `%${query}%`)
          .order("play_count", { ascending: false });

        // Search channels
        const channelsPromise = supabase
          .from("channels")
          .select("*")
          .ilike("title", `%${query}%`);

        const [plResult, songsResult, channelsResult] = await Promise.all([
          playlistsPromise,
          songsPromise,
          channelsPromise,
        ]);

        if (plResult.error) console.error("Playlists search error:", plResult.error);
        if (songsResult.error) console.error("Songs search error:", songsResult.error);
        if (channelsResult.error) console.error("Channels search error:", channelsResult.error);

        // Format playlists
        const plList = plResult.data || [];
        const formattedPlaylists = plList.map((pl: any) => {
          const songsList = (pl.playlist_songs || [])
            .map((ps: any) => ({ ...ps.songs, position: ps.position }))
            .sort((a: any, b: any) => a.position - b.position);
          return { ...pl, songs: songsList };
        }) as PlaylistWithSongs[];

        setPlaylists(formattedPlaylists);
        setSongs(songsResult.data || []);
        setChannels(channelsResult.data || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(typedQuery);
    router.push(`/search?q=${encodeURIComponent(typedQuery.trim())}`);
  };

  const handlePlaySong = (song: any, allSearchResultsSongs: any[]) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("musi_playback_queue", JSON.stringify(allSearchResultsSongs));
    }
    router.push(`/song/${song.id}`);
  };

  const hasResults = playlists.length > 0 || songs.length > 0 || channels.length > 0;

  return (
    <div className="space-y-8 py-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-3"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזרה לראשי</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-display">
            <Search className="w-8 h-8 text-violet-600 dark:text-violet-500 animate-pulse" />
            תוצאות חיפוש
          </h1>
          {searchQuery && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              תוצאות חיפוש עבור: <span className="font-bold text-violet-600 dark:text-violet-400">&quot;{searchQuery}&quot;</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="חפש שיר, אמן, ערוץ או פלייליסט..."
            value={typedQuery}
            onChange={(e) => setTypedQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 text-base pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-right"
            dir="rtl"
          />
        </form>
      </div>

      {/* Tabs */}
      {hasResults && !loading && (
        <div className="flex items-center justify-start overflow-x-auto pb-2 gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            הכל
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "playlists"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <List className="w-4 h-4" />
            פלייליסטים ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "songs"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Music className="w-4 h-4" />
            שירים ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "channels"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Radio className="w-4 h-4" />
            ערוצים ואמנים ({channels.length})
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">מחפש בכל האתר...</p>
        </div>
      ) : !searchQuery.trim() ? (
        <div className="text-center py-20 bg-slate-100/40 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800/40 border-dashed">
          <p className="text-slate-500 dark:text-slate-400 text-base">
            הקלד משהו בשדה החיפוש כדי להתחיל לחפש שירים, אמנים ופלייליסטים.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-20 bg-slate-100/40 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800/40 border-dashed">
          <p className="text-slate-500 dark:text-slate-400 text-base">
            לא נמצאו תוצאות עבור &quot;{searchQuery}&quot;. נסה לחפש משהו אחר.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Playlists Section */}
          {playlists.length > 0 && (activeTab === "all" || activeTab === "playlists") && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-violet-500" />
                פלייליסטים
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlists.map((playlist) => {
                  const thumbnail =
                    playlist.songs?.[0]?.thumbnail_url ||
                    playlist.thumbnail_url ||
                    "https://picsum.photos/seed/placeholder/640/360";
                  return (
                    <Link
                      href={`/playlist/${playlist.id}`}
                      key={playlist.id}
                      className="group flex flex-col bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300 shadow-sm dark:shadow-none"
                    >
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <Image
                          src={thumbnail}
                          alt={playlist.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-3 right-3 bg-violet-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-bold">
                          {(playlist.songs || []).length} שירים
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">
                          {playlist.title}
                        </h3>
                        {playlist.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                            {playlist.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200 dark:border-slate-800/40">
                          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 dark:border-transparent">
                            <Play className="w-2.5 h-2.5 text-cyan-500" />
                            {(playlist.play_count || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 dark:border-transparent">
                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                            {(playlist.likes_count || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Songs Section */}
          {songs.length > 0 && (activeTab === "all" || activeTab === "songs") && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-violet-500" />
                שירים
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {songs.map((song) => {
                  const thumbnail =
                    song.thumbnail_url ||
                    "https://picsum.photos/seed/placeholder/640/360";
                  const isCurrentSong =
                    playerQueue[currentIndex]?.youtube_id === song.youtube_id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song, songs)}
                      className="group flex flex-col bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <Image
                          src={thumbnail}
                          alt={song.title}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div
                          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${
                            isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                            <Play className="w-4 h-4 ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h3
                          className={`font-bold text-xs sm:text-sm mb-1 transition-colors line-clamp-2 leading-tight ${
                            isCurrentSong
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-slate-900 dark:text-white group-hover:text-violet-600"
                          }`}
                        >
                          {song.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels Section */}
          {channels.length > 0 && (activeTab === "all" || activeTab === "channels") && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-500" />
                ערוצים ואמנים
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-lg">
                      {channel.title.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {channel.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ערוץ יוטיוב מסונכרן
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
