'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { SongRow } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface PlayerContextType {
  playlistId: string | null;
  videos: SongRow[];
  currentIndex: number;
  playVideo: (playlistId: string | null, videos: SongRow[], startIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  playerTarget: any;
  setPlayerTarget: (target: any) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isLocalPlayerActive: boolean;
  setIsLocalPlayerActive: (active: boolean) => void;
  videoAnchor: HTMLElement | null;
  setVideoAnchor: (el: HTMLElement | null) => void;
  updateGlobalPlaylist: (newVideos: SongRow[], newIndex: number) => void;
  preferVideo: boolean;
  togglePreferVideo: (val: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [videos, setVideos] = useState<SongRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [playerTarget, setPlayerTarget] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isLocalPlayerActive, setIsLocalPlayerActive] = useState<boolean>(false);
  const [videoAnchor, setVideoAnchor] = useState<HTMLElement | null>(null);
  const [preferVideo, setPreferVideo] = useState<boolean>(false);

  // Tracking 90% play
  const hasTrackedPlay = useRef<boolean>(false);
  const sessionPlayedCount = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferVideo');
      if (stored === 'true') setPreferVideo(true);
    }
  }, []);

  const togglePreferVideo = (val: boolean) => {
    setPreferVideo(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferVideo', String(val));
    }
  };

  useEffect(() => {
    hasTrackedPlay.current = false;
  }, [currentIndex, videos]);

  useEffect(() => {
    if (!playerTarget) return;

    const interval = setInterval(() => {
      try {
        let currTime = 0;
        let dur = 0;
        if (playerTarget.getCurrentTime) {
          currTime = playerTarget.getCurrentTime();
          setCurrentTime(currTime);
        }
        if (playerTarget.getDuration) {
          dur = playerTarget.getDuration();
          setDuration(dur);
        }

        // 90% tracking
        if (dur > 0 && currTime / dur >= 0.9 && !hasTrackedPlay.current && videos[currentIndex]) {
          hasTrackedPlay.current = true;
          sessionPlayedCount.current += 1;
          
          // Increment song play count
          const currentSongId = videos[currentIndex].id;
          if (currentSongId) {
            fetch('/api/youtube', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'record_play', songId: currentSongId })
            }).catch(console.error);
          }

          // If playlist and 3 songs played 90%
          if (playlistId && sessionPlayedCount.current % 3 === 0) {
            fetch('/api/youtube', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'record_playlist_play', playlistId })
            }).catch(console.error);
          }
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [playerTarget, currentIndex, videos, playlistId]);

  const playVideo = (newPlaylistId: string | null, newVideos: SongRow[], startIndex: number) => {
    setPlaylistId(newPlaylistId);
    setVideos(newVideos);
    setCurrentIndex(startIndex);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    sessionPlayedCount.current = 0;
  };

  const playNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
    }
  };

  const updateGlobalPlaylist = (newVideos: SongRow[], newIndex: number) => {
    setVideos(newVideos);
    setCurrentIndex(newIndex);
  };

  return (
    <PlayerContext.Provider
      value={{
        playlistId,
        videos,
        currentIndex,
        playVideo,
        playNext,
        playPrevious,
        isPlaying,
        setIsPlaying,
        playerTarget,
        setPlayerTarget,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        volume,
        setVolume,
        isLocalPlayerActive,
        setIsLocalPlayerActive,
        videoAnchor,
        setVideoAnchor,
        updateGlobalPlaylist,
        preferVideo,
        togglePreferVideo
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
