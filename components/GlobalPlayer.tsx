'use client';

import { usePlayer } from '@/lib/PlayerContext';
import { Play, Pause, SkipForward, SkipBack, Maximize2, X, ChevronUp, ChevronDown, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

import Link from 'next/link';

export default function GlobalPlayer() {
  const { 
    videos, 
    currentIndex, 
    playNext, 
    playPrevious, 
    isPlaying, 
    setIsPlaying,
    playerTarget,
    setPlayerTarget,
    currentTime,
    setCurrentTime,
    duration,
    volume,
    setVolume,
    isLocalPlayerActive,
    videoAnchor,
    playlistTitle,
    playlistId
  } = usePlayer();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const trackedVideoIdRef = useRef<string | null>(null);

  // Reset tracked state when video changes
  useEffect(() => {
    if (videos.length === 0 || currentIndex === -1) return;
    const currentVid = videos[currentIndex];
    if (currentVid && currentVid.id !== trackedVideoIdRef.current) {
      trackedVideoIdRef.current = null;
    }
  }, [currentIndex, videos]);

  // Track 90% play duration
  useEffect(() => {
    if (videos.length === 0 || currentIndex === -1) return;
    const currentVid = videos[currentIndex];
    if (!currentVid) return;
    if (trackedVideoIdRef.current === currentVid.id) return;

    if (duration > 0 && currentTime > 0) {
      const percentage = currentTime / duration;
      if (percentage >= 0.90) {
        trackedVideoIdRef.current = currentVid.id;
        fetch('/api/plays/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: currentVid.id,
            playlistId: playlistId || null
          })
        }).catch(err => console.error('Error tracking play:', err));
      }
    }
  }, [currentTime, duration, currentIndex, videos, playlistId]);
  
  useLayoutEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    
    if (videos.length > 0 && currentIndex !== -1) {
      mainEl.style.paddingBottom = isMinimized ? '0px' : '6rem';
    } else {
      mainEl.style.paddingBottom = '0px';
    }
    return () => {
      mainEl.style.paddingBottom = '0px';
    };
  }, [videos.length, currentIndex, isMinimized]);

  if (videos.length === 0 || currentIndex === -1) {
    return null;
  }

  const currentVideo = videos[currentIndex];

  const togglePlayPause = () => {
    if (playerTarget) {
      if (isPlaying) {
        playerTarget.pauseVideo();
      } else {
        playerTarget.playVideo();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerTarget) {
      playerTarget.seekTo(time, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (playerTarget) {
      playerTarget.setVolume(vol);
    }
  };

  const handleChapterClick = (startTime: number) => {
    setCurrentTime(startTime);
    if (playerTarget) {
       playerTarget.seekTo(startTime, true);
    }
  };

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 transition-transform duration-300 ${isMinimized ? 'translate-y-full' : 'translate-y-0'}`}>
        
        {/* Minimized Toggle Button */}
      {isMinimized && (
        <button 
          onClick={() => setIsMinimized(false)}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-t-lg px-4 py-1 text-slate-400 hover:text-white"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center gap-4">
        
        {/* Video Thumbnail / Mini Player */}
        <Link 
          href="/now-playing"
          className="hidden sm:block relative w-32 h-16 bg-black rounded-md overflow-hidden shrink-0 group hover:ring-2 hover:ring-violet-500/80 transition-all cursor-pointer"
          title="פתח את נגן 'משמיע כעת'"
        >
          <img 
            src={currentVideo.thumbnail || 'https://picsum.photos/seed/placeholder/1280/720'} 
            alt={currentVideo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Info */}
        <Link 
          href="/now-playing"
          className="hidden md:block w-48 min-w-0 shrink-0 hover:opacity-80 transition-opacity cursor-pointer text-right"
          title="פתח את נגן 'משמיע כעת'"
        >
          <p className="text-white font-medium truncate text-sm hover:text-violet-400 transition-colors" title={currentVideo.title}>{currentVideo.title}</p>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1 justify-end">
             <ListMusic className="w-3 h-3" /> {playlistTitle || 'רשימת השמעה'} ({currentIndex + 1}/{videos.length})
          </p>
        </Link>

        {/* Center Controls & Timeline */}
        <div className="flex-1 flex flex-col justify-center items-center gap-2">
          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={playNext} 
              disabled={currentIndex === videos.length - 1}
              className="text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button 
              onClick={togglePlayPause}
              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
           
            <button 
              onClick={playPrevious}
              disabled={currentIndex === 0}
              className="text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400"
            >
              <SkipBack className="w-5 h-5" />
            </button>
          </div>
          
          {/* Timeline */}
          <div className="w-full max-w-xl flex items-center gap-3 text-xs text-slate-400 px-4 relative">
            <span>{formatTime(duration || 0)}</span>
            <div className="flex-1 relative h-1 group cursor-pointer flex items-center">
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={currentTime || 0} 
                onChange={handleSeek}
                dir="ltr"
                className="absolute inset-0 w-full h-full z-10 opacity-0 cursor-pointer"
              />
              <div 
                className="w-full h-1 bg-slate-700 rounded-lg overflow-hidden absolute"
                dir="ltr"
              >
                 <div 
                   className="h-full bg-violet-500 transition-all duration-100 ease-linear"
                   style={{ width: `${duration ? ((currentTime || 0) / duration) * 100 : 0}%` }}
                 />
              </div>
              
              {/* Chapters Markers */}
              {currentVideo.chapters && currentVideo.chapters.length > 0 && duration > 0 && (
                 <div className="absolute inset-0 w-full h-full pointer-events-none" dir="ltr">
                    {currentVideo.chapters.map(chapter => (
                       <div 
                         key={chapter.id}
                         className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-20 pointer-events-auto hover:w-1 hover:bg-white transition-all group/marker"
                         style={{ left: `${(chapter.start_time / duration) * 100}%` }}
                         onClick={() => handleChapterClick(chapter.start_time)}
                       >
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap">
                            {chapter.title}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
            <span>{formatTime(currentTime || 0)}</span>
          </div>
        </div>

        {/* Extras & Volume */}
        <div className="hidden sm:flex w-48 justify-end items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 group">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input 
              type="range"
              min={0}
              max={100}
              value={volume || 0}
              onChange={handleVolumeChange}
              dir="ltr"
              className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              style={{
                background: `linear-gradient(to right, #8b5cf6 ${volume || 0}%, #334155 ${volume || 0}%)`
              }}
            />
          </div>
          <button 
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
      </div>
      <PersistentVideo />
    </>
  );
}

function PersistentVideo() {
  const { 
    videos, 
    currentIndex, 
    isPlaying,
    setIsPlaying,
    playerTarget,
    setPlayerTarget,
    currentTime,
    volume,
    videoAnchor,
    playNext
  } = usePlayer();
  
  const currentVideo = videos[currentIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (playerTarget && currentVideo && currentVideo.youtube_id !== lastVideoIdRef.current) {
      playerTarget.loadVideoById(currentVideo.youtube_id);
      lastVideoIdRef.current = currentVideo.youtube_id;
    }
  }, [currentVideo, playerTarget]);

  useLayoutEffect(() => {
    let animationFrameId: number;
    const updatePosition = () => {
      if (videoAnchor && containerRef.current) {
        const rect = videoAnchor.getBoundingClientRect();
        containerRef.current.style.top = `${rect.top}px`;
        containerRef.current.style.left = `${rect.left}px`;
        containerRef.current.style.width = `${rect.width}px`;
        containerRef.current.style.height = `${rect.height}px`;
        containerRef.current.style.opacity = '1';
        containerRef.current.style.pointerEvents = 'auto';
      } else if (containerRef.current) {
        containerRef.current.style.top = '-9999px';
        containerRef.current.style.opacity = '0';
        containerRef.current.style.pointerEvents = 'none';
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoAnchor]);
  
  if (!currentVideo) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden"
      style={{
        position: 'fixed',
        zIndex: 40,
        pointerEvents: 'none',
        opacity: 0
      }}
    >
      <YouTube
        videoId={currentVideo.youtube_id}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : ''
          },
        }}
        onReady={(e) => {
          setPlayerTarget(e.target);
          e.target.setVolume(volume);
          lastVideoIdRef.current = currentVideo.youtube_id;
          if (isPlaying) {
            e.target.playVideo();
          }
        }}
        onStateChange={(e) => {
          if (e.data === 1) setIsPlaying(true);
          if (e.data === 2) setIsPlaying(false);
          if (e.data === 0) {
            if (currentIndex < videos.length - 1) {
              const nextId = videos[currentIndex + 1].youtube_id;
              e.target.loadVideoById(nextId);
              lastVideoIdRef.current = nextId;
            }
            playNext();
          }
        }}
        className="w-full h-full"
      />
    </div>
  );
}
