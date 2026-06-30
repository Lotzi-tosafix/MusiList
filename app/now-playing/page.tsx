'use client';

import { usePlayer } from '@/lib/PlayerContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ListMusic, 
  ChevronRight, 
  Eye, 
  Clock, 
  CalendarDays, 
  Volume2,
  Music4
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function NowPlayingPage() {
  const { 
    videos, 
    currentIndex, 
    isPlaying, 
    playVideo, 
    setVideoAnchor,
    playlistTitle,
    currentTime,
    duration
  } = usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const queueContainerRef = useRef<HTMLDivElement>(null);

  const activeVideo = currentIndex !== -1 ? videos[currentIndex] : null;

  // Bind the global YouTube player to this container when a video is active
  useEffect(() => {
    if (activeVideo && containerRef.current) {
      setVideoAnchor(containerRef.current);
    }
    return () => setVideoAnchor(null);
  }, [activeVideo, setVideoAnchor]);

  // Scroll active item in queue into view
  useEffect(() => {
    if (queueContainerRef.current) {
      const activeEl = queueContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayFromQueue = (index: number) => {
    playVideo(index);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Link 
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            <span>חזרה לראשי</span>
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-2 justify-end">
            <span>משמיע כעת</span>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping" />
          </h1>
          {playlistTitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              מתוך רשימת ההשמעה: <span className="text-violet-400 font-semibold">{playlistTitle}</span>
            </p>
          )}
        </div>
      </div>

      {activeVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Right Column: YouTube Video Player and Info (8 Cols on large screen) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visualizer & YouTube Overlay Anchor */}
            <div 
              ref={containerRef} 
              className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800/80 group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none z-10" />
              
              {/* Fallback & Waiting UI if YouTube isn't overlaying immediately */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
                <Music4 className="w-12 h-12 text-violet-500 animate-bounce" />
                <p className="text-xs sm:text-sm font-medium text-slate-500">טוען נגן יוטיוב...</p>
              </div>
            </div>

            {/* Video Meta Information */}
            <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/60 shadow-xl space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-right leading-tight">
                  {activeVideo.title}
                </h2>
                {activeVideo.channel && (
                  <div className="flex items-center gap-3 justify-start sm:justify-end mt-2 flex-row-reverse">
                    <span className="font-semibold text-sm sm:text-base text-violet-400 hover:text-violet-300 transition-colors">
                      {activeVideo.channel.title}
                    </span>
                    {activeVideo.channel.thumbnail ? (
                      <img 
                        src={activeVideo.channel.thumbnail} 
                        alt={activeVideo.channel.title}
                        className="w-8 h-8 rounded-full border border-slate-700" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Music4 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400 border-t border-slate-800/60 pt-4 justify-start sm:justify-end flex-row-reverse">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>{activeVideo.view_count ? activeVideo.view_count.toLocaleString() : '0'} צפיות</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>{formatDuration(activeVideo.duration)} דקות</span>
                </div>
                {activeVideo.published_at && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    <span>פורסם בתאריך: {new Date(activeVideo.published_at).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {activeVideo.description && (
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/40">
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar text-right">
                    {activeVideo.description}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Current Playing Queue (4 Cols on large screen) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2 flex-row-reverse">
              <span className="text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800/60 px-2.5 py-1 rounded-full">
                {currentIndex + 1} מתוך {videos.length}
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-row-reverse">
                <ListMusic className="w-5 h-5 text-violet-400" />
                <span>תור השירים הנוכחי</span>
              </h3>
            </div>

            <div 
              ref={queueContainerRef}
              className="bg-slate-900/30 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Queue Items */}
              <div className="max-h-[500px] lg:max-h-[580px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/40">
                {videos.map((item, index) => {
                  const isActive = index === currentIndex;
                  
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      data-active={isActive}
                      onClick={() => handlePlayFromQueue(index)}
                      className={`group flex items-center gap-3 p-3.5 hover:bg-slate-800/30 transition-all duration-300 cursor-pointer text-right flex-row-reverse ${
                        isActive 
                          ? 'bg-violet-950/40 border-r-4 border-r-violet-500 shadow-inner' 
                          : ''
                      }`}
                    >
                      {/* Thumbnail Cover */}
                      <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800/40">
                        {item.thumbnail ? (
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                            <Music4 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>

                      {/* Title & Channel */}
                      <div className="flex-1 min-w-0 pr-1 pl-1">
                        <h4 className={`text-xs sm:text-sm font-medium line-clamp-1 mb-0.5 transition-colors ${
                          isActive ? 'text-violet-400 font-bold' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {item.title}
                        </h4>
                        <p className="text-slate-400 text-[10px] sm:text-xs truncate">
                          {item.channel?.title || 'ערוץ לא ידוע'}
                        </p>
                      </div>

                      {/* Play State Bars */}
                      <div className="w-8 flex items-center justify-center text-slate-500 font-medium font-mono text-xs">
                        {isActive && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-3.5">
                            <div className="w-0.5 bg-violet-500 animate-[bounce_1s_infinite] rounded-t" />
                            <div className="w-0.5 bg-violet-500 animate-[bounce_1.2s_infinite] rounded-t" />
                            <div className="w-0.5 bg-violet-500 animate-[bounce_0.8s_infinite] rounded-t" />
                          </div>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed text-slate-400 flex flex-col items-center justify-center gap-4">
          <ListMusic className="w-16 h-16 text-slate-600 animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-300">תור ההשמעה ריק</h3>
            <p className="text-sm text-slate-500 max-w-md">אנא בחר שיר או פלייליסט מדף הבית כדי להתחיל להאזין וליהנות מהחוויה.</p>
          </div>
          <Link
            href="/"
            className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-105 transition-transform text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-violet-500/10"
          >
            גלו שירים חדשים
          </Link>
        </div>
      )}
    </div>
  );
}
