'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, CalendarDays, Flame } from 'lucide-react';
import { PlaylistWithVideos } from '@/lib/api';

interface PlaylistCarouselProps {
  playlists: PlaylistWithVideos[];
  title: string;
  type: 'recent' | 'trending';
  viewAllHref: string;
}

export default function PlaylistCarousel({ playlists, title, type, viewAllHref }: PlaylistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
        behavior: 'smooth'
      });
    }
  };

  if (!playlists || playlists.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-display">
          {type === 'recent' ? (
            <CalendarDays className="w-6 h-6 text-violet-400 animate-pulse" />
          ) : (
            <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
          )}
          {title}
        </h2>
        
        <div className="flex items-center gap-3">
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 bg-slate-900/60 hover:bg-slate-900 px-4 py-2 rounded-full border border-slate-800/80"
          >
            <span>צפה בהכל</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
          
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-lg border border-slate-900">
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-md hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
              title="הקודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-md hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
              title="הבא"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {playlists.map(playlist => {
          const thumbnail = playlist.videos[0]?.thumbnail || 'https://picsum.photos/seed/placeholder/640/360';
          return (
            <Link 
              href={`/playlist/${playlist.id}`} 
              key={playlist.id} 
              className="group flex-shrink-0 w-[280px] sm:w-[320px] bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden hover:bg-slate-800/40 transition-all duration-300 snap-start"
            >
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                <Image
                  src={thumbnail}
                  alt={playlist.title}
                  fill
                  sizes="(max-width: 640px) 280px, 320px"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-violet-600 text-white text-[10px] px-2 py-1 rounded font-bold">
                  {playlist.videos.length} סרטונים
                </div>
              </div>
              <div className="p-5 flex flex-col h-[160px]">
                <h3 className="font-bold text-base text-white mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
                  {playlist.title}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1 leading-relaxed">
                  {playlist.description || 'אין תיאור זמין לפלייליסט זה.'}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {(playlist.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full uppercase">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Play className="w-3 h-3 text-cyan-400" />
                    {(playlist.play_count || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
