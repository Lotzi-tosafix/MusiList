"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  CalendarDays,
  Flame,
  Search,
  ArrowRight,
  Music,
  Loader2,
  Heart,
  Plus,
} from "lucide-react";
import { PlaylistWithSongs } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default function PlaylistsPage(props: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const searchParams = use(props.searchParams);
  const initialSort = searchParams.sort === "trending" ? "trending" : "recent";
  const initialQuery = searchParams.q || "";

  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveSort] = useState<"recent" | "trending">(
    initialSort,
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    async function fetchPlaylists() {
      setLoading(true);
      try {
        const sortBy = activeTab === "recent" ? "created_at" : "play_count";
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
          console.error("Error fetching playlists:", error);
        } else {
          const list = data as any[];
          const formatted = list.map((pl) => {
            const songs = (pl.playlist_songs || [])
              .map((ps: any) => ({ ...ps.songs, position: ps.position }))
              .sort((a: any, b: any) => a.position - b.position);
            return { ...pl, songs };
          }) as PlaylistWithSongs[];
          setPlaylists(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, [activeTab]);

  const filteredPlaylists = playlists.filter((playlist) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      playlist.title.toLowerCase().includes(query) ||
      (playlist.description || "").toLowerCase().includes(query)
    );
  });

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
            <Music className="w-8 h-8 text-violet-600 dark:text-violet-500 animate-bounce" />
            גלה פלייליסטים
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            דפדף בכל הפלייליסטים הציבוריים שנוצרו על ידי הקהילה
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ייבוא פלייליסט</span>
          </Link>

          <div className="relative w-full md:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="חיפוש פלייליסט או קטגוריה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm pl-4 pr-10 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-violet-500/80 transition-colors focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
        </div>
      </div>

      {/* Sorting Tabs / Menu */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setActiveSort("recent")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "recent"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/40"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>החדשים ביותר</span>
          </button>

          <button
            onClick={() => setActiveSort("trending")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "trending"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/40"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>הנצפים ביותר</span>
          </button>
        </div>
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            טוען פלייליסטים...
          </p>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-800/40 border-dashed">
          <p className="text-slate-400 text-base">
            לא נמצאו פלייליסטים תואמים לחיפוש שלך.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlaylists.map((playlist) => {
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-violet-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-bold">
                    {(playlist.songs || []).length} שירים
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 min-h-[140px]">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">
                    {playlist.title}
                  </h3>
                  {playlist.description ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 flex-1 leading-relaxed">
                      {playlist.description}
                    </p>
                  ) : (
                    <div className="flex-1 mb-3"></div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200 dark:border-slate-800/40">
                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 dark:border-transparent">
                      <Play className="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400" />
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
      )}
    </div>
  );
}
