"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Flame,
} from "lucide-react";
import { PlaylistWithSongs } from "@/lib/api";

interface PlaylistCarouselProps {
  playlists: PlaylistWithSongs[];
  title: string;
  type: "recent" | "trending";
  viewAllHref: string;
}

export default function PlaylistCarousel({
  playlists,
  title,
  type,
  viewAllHref,
}: PlaylistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left:
          scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  if (!playlists || playlists.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
          {type === "recent" ? (
            <CalendarDays className="w-6 h-6 text-violet-500 dark:text-violet-400 animate-pulse" />
          ) : (
            <Flame className="w-6 h-6 text-orange-500 dark:text-orange-400 animate-pulse" />
          )}
          {title}
        </h2>

        <div className="flex items-center gap-3">
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800/80"
          >
            <span>צפה בהכל</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="relative group/carousel">
        {/* Right Navigation Arrow (Previous) */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 bg-violet-600 hover:bg-violet-500 border border-violet-500/50 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 cursor-pointer hover:scale-110"
          title="הקודם"
        >
          <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {playlists.map((playlist) => {
            const thumbnail =
              playlist.songs?.[0]?.thumbnail_url ||
              playlist.thumbnail_url ||
              "https://picsum.photos/seed/placeholder/640/360";
            return (
              <Link
                href={`/playlist/${playlist.id}`}
                key={playlist.id}
                className="group flex-shrink-0 w-[200px] sm:w-[240px] bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm dark:shadow-none transition-all duration-300 snap-start"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={playlist.title}
                    fill
                    sizes="(max-width: 640px) 200px, 240px"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-violet-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    {(playlist.songs || []).length} שירים
                  </div>
                </div>
                <div className="p-3.5 flex flex-col h-[125px]">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">
                    {playlist.title}
                  </h3>
                  {playlist.description ? (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 flex-1 leading-relaxed">
                      {playlist.description}
                    </p>
                  ) : (
                    <div className="flex-1 mb-2"></div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-none px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400" />
                      {(playlist.play_count || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Left Navigation Arrow (Next) */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 bg-violet-600 hover:bg-violet-500 border border-violet-500/50 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 cursor-pointer hover:scale-110"
          title="הבא"
        >
          <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
      </div>
    </section>
  );
}
