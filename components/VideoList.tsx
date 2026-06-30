'use client';

import { VideoRow, ChannelRow } from '@/lib/api';
import { usePlayer, PlayableVideo } from '@/lib/PlayerContext';
import { Play, Clock, Eye, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VideoList({ videos, channel, playlistId }: { videos: VideoRow[], channel?: ChannelRow, playlistId?: string }) {
  const { setPlaylist, playVideo, currentIndex, videos: currentPlaylist, isPlaying } = usePlayer();
  const router = useRouter();

  const handlePlay = (index: number) => {
    // Map to PlayableVideo
    const playableVideos: PlayableVideo[] = videos.map(v => ({
      ...v,
      youtube_id: v.id,
      channel: channel
    }));

    setPlaylist(playableVideos, channel ? `שירי ${channel.title}` : 'רשימת השמעה', playlistId || null);
    playVideo(index);
    router.push('/now-playing');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num > 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-slate-900/40 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="divide-y divide-slate-800/60">
        {videos.map((video, index) => {
          // Check if this video is currently playing by ID (since we might be playing from a different list instance but same video)
          const isCurrent = currentPlaylist[currentIndex]?.id === video.id;
          
          return (
            <div 
              key={video.id}
              onClick={() => handlePlay(index)}
              className={`group flex items-center gap-4 p-4 hover:bg-slate-800/40 transition-colors cursor-pointer ${isCurrent ? 'bg-violet-900/20' : ''}`}
            >
              <div className="w-8 text-center text-slate-500 font-medium font-mono text-sm hidden sm:block">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end justify-center gap-0.5 h-4">
                    <div className="w-1 bg-violet-500 animate-[bounce_1s_infinite] rounded-t" />
                    <div className="w-1 bg-violet-500 animate-[bounce_1.2s_infinite] rounded-t" />
                    <div className="w-1 bg-violet-500 animate-[bounce_0.8s_infinite] rounded-t" />
                  </div>
                ) : (
                  index + 1
                )}
              </div>

              <div className="relative w-24 h-14 sm:w-32 sm:h-18 rounded-lg overflow-hidden shrink-0 bg-slate-950">
                <img src={video.thumbnail || ''} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h3 className={`font-medium text-sm sm:text-base line-clamp-1 mb-1 transition-colors ${isCurrent ? 'text-violet-400' : 'text-slate-200 group-hover:text-white'}`}>
                  {video.title}
                </h3>
                {channel && <p className="text-slate-500 text-xs">{channel.title}</p>}
              </div>

              <div className="hidden md:flex items-center gap-6 text-slate-500 text-xs">
                <div className="flex items-center gap-1.5 w-16 justify-end">
                   <Eye className="w-3.5 h-3.5" />
                   <span>{formatNumber(video.view_count)}</span>
                </div>
                <div className="flex items-center gap-1.5 w-16 justify-end">
                   <Clock className="w-3.5 h-3.5" />
                   <span>{formatDuration(video.duration)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
