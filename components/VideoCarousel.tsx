'use client';

import { VideoWithChannel } from '@/lib/api';
import Link from 'next/link';
import { usePlayer } from '@/lib/PlayerContext';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoCarousel({ 
  videos, 
  title, 
  viewAllLink 
}: { 
  videos: VideoWithChannel[], 
  title: string,
  viewAllLink: string
}) {
  const { setPlaylist, playVideo } = usePlayer();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(true);
  const [showRightBtn, setShowRightBtn] = useState(true);
  const router = useRouter();

  if (!videos || videos.length === 0) return null;

  const handlePlay = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const playableVideos = videos.map((v, i) => ({
      id: v.id,
      youtube_id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      position: i,
      channel: v.channel
    }));
    
    setPlaylist(playableVideos as any, title);
    playVideo(index);
    router.push('/now-playing');
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
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
          {videos.map((video, index) => (
            <div 
              key={video.id} 
              className="w-64 sm:w-72 shrink-0 snap-start"
            >
              <Link
                href={`/video/${video.id}`}
                className="group block relative bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden hover:border-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-900/20 h-full"
              >
                <div className="aspect-video relative overflow-hidden bg-slate-950">
                  {video.thumbnail ? (
                     <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">אין תמונה</div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => handlePlay(e, index)}
                      className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-violet-500"
                    >
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium line-clamp-2 text-sm mb-1 group-hover:text-violet-300 transition-colors text-right" title={video.title}>{video.title}</h3>
                  <p className="text-slate-400 text-xs line-clamp-1 text-right">{video.channel?.title}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
