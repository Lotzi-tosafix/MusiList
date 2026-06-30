'use client';

import { usePlayer } from '@/lib/PlayerContext';
import { Play, Pause, SkipForward, SkipBack, Maximize2, X, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
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
    playlistId
  } = usePlayer();
  
  const [isMinimized, setIsMinimized] = useState(false);
  
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
        <Link href={`/playlist/${playlistId}`} className="hidden sm:block relative w-32 h-16 bg-black rounded-md overflow-hidden shrink-0 group hover:opacity-80 transition-opacity">
          <img 
            src={currentVideo.thumbnail || 'https://picsum.photos/seed/placeholder/1280/720'} 
            alt={currentVideo.title}
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Info */}
        <div className="hidden md:block w-48 min-w-0 shrink-0">
          <p className="text-white font-medium truncate text-sm">{currentVideo.title}</p>
          <p className="text-xs text-slate-400 truncate">
            {currentIndex + 1} מתוך {videos.length}
          </p>
        </div>

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
          <div className="w-full max-w-xl flex items-center gap-3 text-xs text-slate-400 px-4">
            <span>{formatTime(duration || 0)}</span>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime || 0} 
              onChange={handleSeek}
              dir="ltr"
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              style={{
                background: `linear-gradient(to right, #8b5cf6 ${duration ? ((currentTime || 0) / duration) * 100 : 0}%, #334155 ${duration ? ((currentTime || 0) / duration) * 100 : 0}%)`
              }}
            />
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
