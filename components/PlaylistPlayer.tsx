'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Copy, Clock, Loader2 } from 'lucide-react';
import { PlaylistWithVideos, VideoRow } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function PlaylistPlayer({ playlist }: { playlist: PlaylistWithVideos }) {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<VideoRow | null>(playlist.videos[0] || null);
  const [user, setUser] = useState<User | null>(null);
  const [isForking, setIsForking] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleFork = async () => {
    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        }
      });
      return;
    }
    
    setIsForking(true);
    
    try {
      // 1. Copy playlist
      const { data: newPlaylist, error: playlistError } = await (supabase as any)
        .from('playlists')
        .insert([{
          title: `${playlist.title} (העתק)`,
          description: playlist.description,
          tags: playlist.tags,
          is_public: true,
          play_count: 0,
          creator_id: user.id
        }])
        .select()
        .single();
        
      if (playlistError) throw new Error('שגיאה בשכפול הפלייליסט: ' + playlistError.message);
      
      // 2. Copy videos
      const videosToInsert = playlist.videos.map(v => ({
        playlist_id: newPlaylist.id,
        youtube_id: v.youtube_id,
        title: v.title,
        thumbnail: v.thumbnail,
        position: v.position
      }));
      
      const { error: videosError } = await (supabase as any)
        .from('videos')
        .insert(videosToInsert);
        
      if (videosError) throw new Error('שגיאה בשכפול הסרטונים: ' + videosError.message);
      
      router.push(`/playlist/${newPlaylist.id}`);
    } catch (err: any) {
      alert(err.message);
      setIsForking(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Player Section */}
      <div className="flex-1 space-y-6">
        <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-xl">
          {activeVideo ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              בחר סרטון כדי להתחיל לנגן
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{playlist.title}</h1>
          <p className="text-slate-400 mb-4">{playlist.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
            <div className="flex items-center gap-1">
              <Play className="w-4 h-4 text-cyan-400" />
              {(playlist.play_count || 0).toLocaleString()} השמעות
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              נוצר לאחרונה
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleFork}
              disabled={isForking}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isForking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              {user ? 'שכפל וערוך (Fork)' : 'התחבר כדי לשכפל'}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Videos */}
      <div className="w-full lg:w-96 bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-8rem)] sticky top-24 shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="font-bold text-white">רשימת השמעה ({playlist.videos.length})</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {playlist.videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className={`w-full text-right flex gap-3 p-2 rounded-xl transition-colors ${
                activeVideo?.id === video.id ? 'bg-violet-900/30 border border-violet-500/30' : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                <Image src={video.thumbnail || 'https://picsum.photos/seed/placeholder/640/360'} alt={video.title} fill className="object-cover" referrerPolicy="no-referrer" />
                {activeVideo?.id === video.id && (
                  <div className="absolute inset-0 bg-violet-600/40 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <p className={`text-sm font-medium line-clamp-2 ${activeVideo?.id === video.id ? 'text-violet-300' : 'text-slate-300'}`}>
                  {index + 1}. {video.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
