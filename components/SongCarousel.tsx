"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SongRow } from "@/lib/api";
import { usePlayer } from "@/lib/PlayerContext";

interface SongCarouselProps {
  songs: SongRow[];
  title: string;
  type: "recent" | "trending";
  viewAllHref?: string;
}

export default function SongCarousel({
  songs,
  title,
  type,
  viewAllHref,
}: SongCarouselProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    playVideo,
    currentIndex,
    videos: playerQueue,
    isPlaying,
    setIsPlaying,
  } = usePlayer();

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

  const handlePlaySong = (songIndex: number) => {
    const song = songs[songIndex];
    if (song) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("musi_playback_queue", JSON.stringify(songs));
      }
      router.push(`/song/${song.id}`);
    }
  };

  if (!songs || songs.length === 0) return null;

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

        {viewAllHref && (
          <div className="flex items-center gap-3">
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800/80"
            >
              <span>צפה בהכל</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        )}
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
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {songs.map((song, index) => {
            const thumbnail =
              song.thumbnail_url ||
              "https://picsum.photos/seed/placeholder/640/360";
            const isCurrentSong =
              playerQueue[currentIndex]?.youtube_id === song.youtube_id;

            return (
              <div
                key={song.id}
                className="group flex-shrink-0 w-[180px] sm:w-[220px] bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm dark:shadow-none transition-all duration-300 snap-start cursor-pointer"
                onClick={() => handlePlaySong(index)}
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={song.title}
                    fill
                    sizes="(max-width: 640px) 180px, 220px"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div
                    className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <div
                      className={`w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg ${isCurrentSong && isPlaying ? "text-violet-400" : ""}`}
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3 flex flex-col">
                  <h3
                    className={`font-bold text-sm mb-1 transition-colors line-clamp-2 leading-tight ${isCurrentSong ? "text-violet-600 dark:text-violet-400" : "text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400"}`}
                  >
                    {song.title}
                  </h3>
                </div>
              </div>
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
