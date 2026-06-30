'use client';

import { PlayableVideo, usePlayer } from '@/lib/PlayerContext';
import { Eye, ThumbsUp, Clock, CalendarDays, ListMusic, Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function VideoPlayer({ video }: { video: PlayableVideo }) {
  const { setPlaylist, playVideo, currentIndex, videos, setVideoAnchor } = usePlayer();
  const isPlayingThis = videos[currentIndex]?.id === video.id;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlayingThis && containerRef.current) {
      setVideoAnchor(containerRef.current);
    } else {
       // if we are not playing this, maybe we should play it automatically on load?
       if (!isPlayingThis && videos.length === 0) {
          setPlaylist([video], video.title);
          playVideo(0);
       }
    }
    return () => setVideoAnchor(null);
  }, [isPlayingThis, setVideoAnchor, video]);

  const handlePlay = () => {
    setPlaylist([video], video.title);
    playVideo(0);
  };

  const handleChapterClick = (startTime: number) => {
     if (!isPlayingThis) {
       setPlaylist([video], video.title);
       playVideo(0);
       // We can't seek immediately, global player handles it when it's ready.
       // Ideally we expose seekTo from context.
     }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-6">
        <div ref={containerRef} className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800">
           {!isPlayingThis && (
             <>
               <img src={video.thumbnail || ''} className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <button onClick={handlePlay} className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                    <Play className="w-10 h-10 ml-2" />
                 </button>
               </div>
             </>
           )}
        </div>

        <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
           <h1 className="text-2xl sm:text-3xl font-bold text-white">{video.title}</h1>
           
           <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
             {video.channel && (
               <Link href={`/channel/${video.channel.id}`} className="flex items-center gap-3 hover:text-white transition-colors">
                 {video.channel.thumbnail ? (
                   <img src={video.channel.thumbnail} className="w-10 h-10 rounded-full" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-slate-800" />
                 )}
                 <span className="font-medium text-base text-slate-200">{video.channel.title}</span>
               </Link>
             )}

             <div className="flex items-center gap-2">
               <Eye className="w-4 h-4 text-cyan-400" />
               <span>{(video.view_count || 0).toLocaleString()} צפיות</span>
             </div>
             
             {video.like_count ? (
                <div className="flex items-center gap-2">
                 <ThumbsUp className="w-4 h-4 text-violet-400" />
                 <span>{(video.like_count).toLocaleString()} לייקים</span>
               </div>
             ) : null}

             <div className="flex items-center gap-2">
               <CalendarDays className="w-4 h-4 text-emerald-400" />
               <span>{new Date(video.published_at || '').toLocaleDateString('he-IL')}</span>
             </div>
           </div>

           {video.description && (
             <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
               <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">{video.description}</pre>
             </div>
           )}
        </div>
      </div>

      {video.chapters && video.chapters.length > 0 && (
        <div className="w-full lg:w-80 space-y-4 shrink-0">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <ListMusic className="w-5 h-5 text-violet-400" />
             פרקים (Chapters)
           </h3>
           <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
             {video.chapters.map((chapter, i) => {
                const m = Math.floor(chapter.start_time / 60);
                const s = Math.floor(chapter.start_time % 60);
                const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
                
                return (
                  <button 
                    key={chapter.id}
                    onClick={() => handleChapterClick(chapter.start_time)}
                    className="w-full text-right p-4 hover:bg-slate-800/60 transition-colors flex items-center gap-4 group"
                  >
                    <span className="text-violet-400 font-mono text-xs font-medium w-10 text-center bg-violet-900/20 py-1 rounded-md">{timeStr}</span>
                    <span className="text-sm text-slate-300 group-hover:text-white font-medium flex-1 line-clamp-2">{chapter.title}</span>
                  </button>
                )
             })}
           </div>
        </div>
      )}
    </div>
  );
}
