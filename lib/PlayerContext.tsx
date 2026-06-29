'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { VideoRow } from '@/lib/api';

interface PlayerContextType {
  playlistId: string | null;
  videos: VideoRow[];
  currentIndex: number;
  playVideo: (playlistId: string, videos: VideoRow[], startIndex: number) => void;
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
  updateGlobalPlaylist: (newVideos: VideoRow[], newIndex: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [playerTarget, setPlayerTarget] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isLocalPlayerActive, setIsLocalPlayerActive] = useState<boolean>(false);
  const [videoAnchor, setVideoAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!playerTarget) return;

    const interval = setInterval(() => {
      try {
        if (playerTarget.getCurrentTime) {
          setCurrentTime(playerTarget.getCurrentTime());
        }
        if (playerTarget.getDuration) {
          setDuration(playerTarget.getDuration());
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [playerTarget]);

  const playVideo = (newPlaylistId: string, newVideos: VideoRow[], startIndex: number) => {
    setPlaylistId(newPlaylistId);
    setVideos(newVideos);
    setCurrentIndex(startIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const playNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const updateGlobalPlaylist = (newVideos: VideoRow[], newIndex: number) => {
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
        updateGlobalPlaylist
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
