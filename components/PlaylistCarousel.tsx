'use client';

import { PlaylistWithChannel } from '@/lib/api';
import Link from 'next/link';
import { Play, Music4, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function PlaylistCarousel({ 
  playlists, 
  title, 
  viewAllLink 
}: { 
  playlists: PlaylistWithChannel[], 
  title: string,
  viewAllLink: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(true);
  const [showRightBtn, setShowRightBtn] = useState(true);

  if (!playlists || playlists.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      // In RTL, scrollLeft behaves differently depending on the browser.
      // To be safe and simple, we scrollBy a relative pixel value.
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // In RTL, scrollLeft can be 0 at the right edge, and negative as we scroll left.
      // Let's check boundaries gracefully.
      const isRtl = document.dir === 'rtl';
      if (isRtl) {
        setShowRightBtn(scrollLeft < -10);
        setShowLeftBtn(Math.abs(scrollLeft) + clientWidth < scrollWidth - 10);
      } else {
        setShowLeftBtn(scrollLeft > 10);
        setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 10);
      }
    }
  };

  return (
    <section className="space-y-6 relative group/carousel">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold font-display text-white border-r-4 border-violet-600 pr-3">
          {title}
        </h2>
        <Link 
          href={viewAllLink}
          className="text-xs sm:text-sm font-semibold text-violet-400 hover:text-violet-300 transition-all flex items-center gap-1 bg-violet-950/40 hover:bg-violet-900/60 px-4 py-2 rounded-full border border-violet-900/40 hover:border-violet-500/50"
        >
          ראה הכל ←
        </Link>
      </div>

      {/* Slider Container Wrapper */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white flex items-center justify-center shadow-xl hover:scale-105 hover:bg-violet-600 hover:border-violet-500 transition-all z-20 opacity-0 group-hover/carousel:opacity-100 duration-300"
          aria-label="הקודם"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white flex items-center justify-center shadow-xl hover:scale-105 hover:bg-violet-600 hover:border-violet-500 transition-all z-20 opacity-0 group-hover/carousel:opacity-100 duration-300"
          aria-label="הבא"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Horizontal Scrolling Box */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-none snap-x snap-mandatory py-4 px-1"
        >
          {playlists.map((playlist) => {
            return (
              <div 
                key={playlist.id}
                className="w-48 sm:w-56 shrink-0 snap-start"
              >
                <Link 
                  href={`/playlist/${playlist.id}`}
                  className="group block relative bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4 hover:bg-slate-900/80 hover:border-violet-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/20 h-full flex flex-col justify-between"
                >
                  <div>
                    {/* Playlist Art Cover */}
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800/60 mb-4 flex items-center justify-center">
                      {playlist.thumbnail ? (
                        <img 
                          src={playlist.thumbnail} 
                          alt={playlist.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-indigo-500/10 to-cyan-400/5 group-hover:opacity-80 transition-opacity" />
                          <Music4 className="w-16 h-16 text-slate-700 group-hover:text-violet-500/60 transition-colors duration-300" />
                        </>
                      )}
                      
                      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800/50 text-[10px] font-mono text-slate-400 font-bold">
                        פלייליסט
                      </div>

                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <Play className="w-6 h-6 fill-current ml-1" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-violet-300 transition-colors mb-1 text-right" title={playlist.title}>
                      {playlist.title}
                    </h3>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/50">
                    <p className="text-slate-400 text-xs line-clamp-1 text-right font-medium">
                      {playlist.channel?.title}
                    </p>
                    {playlist.last_sync_at && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end mt-1">
                        <CalendarDays className="w-3 h-3 text-slate-600" />
                        סונכרן: {new Date(playlist.last_sync_at).toLocaleDateString('he-IL')}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
