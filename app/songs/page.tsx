"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Play,
  CalendarDays,
  Flame,
  Search,
  ArrowRight,
  Music,
  Loader2,
} from "lucide-react";
import { SongRow } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/lib/PlayerContext";

export const dynamic = "force-dynamic";

export default function SongsPage(props: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const router = useRouter();
  const searchParams = use(props.searchParams);
  const initialSort = searchParams.sort === "trending" ? "trending" : "recent";

  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<"recent" | "trending">(
    initialSort,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    playVideo,
    currentIndex,
    videos: playerQueue,
    isPlaying,
    setIsPlaying,
  } = usePlayer();

  useEffect(() => {
    async function fetchSongs() {
      setLoading(true);
      try {
        const sortBy = activeSort === "recent" ? "published_at" : "play_count";
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .order(sortBy, { ascending: false });

        if (error) {
          console.error("Error fetching songs:", error);
        } else {
          setSongs(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, [activeSort]);

  const filteredSongs = songs.filter((song) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return song.title.toLowerCase().includes(query);
  });

  const handlePlaySong = (songIndex: number) => {
    const songToPlay = filteredSongs[songIndex];
    if (songToPlay) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("musi_playback_queue", JSON.stringify(filteredSongs));
      }
      router.push(`/song/${songToPlay.id}`);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-3"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזרה לראשי</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-display">
            <Music className="w-8 h-8 text-violet-600 dark:text-violet-500 animate-pulse" />
            גלה שירים
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            דפדף בכל השירים והסינגלים שסונכרנו מערוצי היוטיוב
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש שיר או אמן..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm pl-4 pr-10 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-violet-500/80 transition-colors focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </div>

      {/* Sorting Tabs */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setActiveSort("recent")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeSort === "recent"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/40"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>החדשים ביותר</span>
          </button>

          <button
            onClick={() => setActiveSort("trending")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeSort === "trending"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/40"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>הנשמעים ביותר</span>
          </button>
        </div>
      </div>

      {/* Songs Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">טוען שירים...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-800/40 border-dashed">
          <p className="text-slate-400 text-base">
            לא נמצאו שירים תואמים לחיפוש שלך.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredSongs.map((song, index) => {
            const thumbnail =
              song.thumbnail_url ||
              "https://picsum.photos/seed/placeholder/640/360";
            const isCurrentSong =
              playerQueue[currentIndex]?.youtube_id === song.youtube_id;

            return (
              <div
                key={song.id}
                onClick={() => handlePlaySong(index)}
                className="group flex flex-col bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div
                    className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${
                      isCurrentSong
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg ${
                        isCurrentSong && isPlaying ? "text-violet-500 dark:text-violet-400" : ""
                      }`}
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3
                    className={`font-bold text-xs sm:text-sm mb-1 transition-colors line-clamp-2 leading-tight ${
                      isCurrentSong
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400"
                    }`}
                  >
                    {song.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
