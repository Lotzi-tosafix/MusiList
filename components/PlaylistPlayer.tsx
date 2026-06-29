'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Copy, Clock, Loader2, GripVertical, Shuffle, RotateCcw, ArrowDownAZ, ArrowUpAZ, CalendarDays, ArrowUp, ArrowDown, Eye, Pencil } from 'lucide-react';
import { PlaylistWithVideos, VideoRow } from '@/lib/api';
import { usePlayer } from '@/lib/PlayerContext';
import YouTube from 'react-youtube';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePlaylistItem({ video, activeVideoId, index, onClick, isDraggable }: { video: VideoRow, activeVideoId: string | undefined, index: number, onClick: () => void, isDraggable: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
      activeVideoId === video.id ? 'bg-violet-900/30 border border-violet-500/30' : 'hover:bg-slate-800/50 border border-transparent'
    }`}>
      {isDraggable && (
        <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-slate-500 p-1">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <button onClick={onClick} className="flex-1 flex gap-3 text-right">
        <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
          <img src={video.thumbnail || 'https://picsum.photos/seed/placeholder/640/360'} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          {activeVideoId === video.id && (
            <div className="absolute inset-0 bg-violet-600/40 flex items-center justify-center">
              <Play className="w-6 h-6 text-white drop-shadow-md" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className={`text-sm font-medium line-clamp-2 ${activeVideoId === video.id ? 'text-violet-300' : 'text-slate-300'}`}>
            {index + 1}. {video.title}
          </p>
        </div>
      </button>
    </div>
  );
}

export default function PlaylistPlayer({ playlist }: { playlist: PlaylistWithVideos }) {
  const router = useRouter();
  const { 
    playlistId: globalPlaylistId, 
    videos: globalVideos, 
    currentIndex: globalIndex, 
    playVideo, 
    isPlaying, 
    setIsPlaying,
    setIsLocalPlayerActive,
    setPlayerTarget,
    volume,
    currentTime,
    playNext,
    setVideoAnchor,
    updateGlobalPlaylist
  } = usePlayer();
  const [user, setUser] = useState<User | null>(null);
  
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  
  const [alphaSortDir, setAlphaSortDir] = useState<'asc' | 'desc' | null>(null);
  const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc' | null>(null);
  const [viewsSortDir, setViewsSortDir] = useState<'asc' | 'desc' | null>(null);

  // Define activeVideo based on global state if this is the active playlist
  const isThisPlaylistPlaying = globalPlaylistId === playlist.id;
  const activeVideo = isThisPlaylistPlaying && globalIndex >= 0 
    ? globalVideos[globalIndex] 
    : (videos.length > 0 ? videos[0] : null);

  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isThisPlaylistPlaying && containerRef.current) {
      setVideoAnchor(containerRef.current);
    } else {
      setVideoAnchor(null);
    }
    return () => setVideoAnchor(null);
  }, [isThisPlaylistPlaying, setVideoAnchor]);

  useEffect(() => {
    setIsLocalPlayerActive(isThisPlaylistPlaying);
    return () => setIsLocalPlayerActive(false);
  }, [isThisPlaylistPlaying, setIsLocalPlayerActive]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // This runs to initialize sorting/ordering
    const timer = setTimeout(() => {
      if (user) {
        const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
        const savedOrder = localStorage.getItem(key);
        if (savedOrder) {
          try {
            const orderIds = JSON.parse(savedOrder) as string[];
            const newVideos = [...playlist.videos].sort((a, b) => {
              const idxA = orderIds.indexOf(a.id);
              const idxB = orderIds.indexOf(b.id);
              if (idxA === -1 && idxB === -1) return 0;
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            });
            setVideos(newVideos);
            setIsCustomOrder(true);
          } catch (e) {
            setVideos([...playlist.videos].sort((a, b) => a.position - b.position));
          }
        } else {
          setVideos([...playlist.videos].sort((a, b) => a.position - b.position));
        }
      } else {
        setVideos([...playlist.videos].sort((a, b) => a.position - b.position));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, playlist]);

  const saveCustomOrder = (newVideos: VideoRow[]) => {
    setVideos(newVideos);
    if (user) {
      const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
      localStorage.setItem(key, JSON.stringify(newVideos.map(v => v.id)));
      setIsCustomOrder(true);
    }
    if (isThisPlaylistPlaying && activeVideo) {
      const newIndex = newVideos.findIndex(v => v.id === activeVideo.id);
      updateGlobalPlaylist(newVideos, newIndex >= 0 ? newIndex : 0);
    }
  };

  const resetOrder = () => {
    if (confirm('האם אתה בטוח שברצונך לחזור לסדר המקורי של הפלייליסט?')) {
      if (user) {
        const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
        localStorage.removeItem(key);
      }
      const newVideos = [...playlist.videos].sort((a, b) => a.position - b.position);
      setVideos(newVideos);
      setIsCustomOrder(false);
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);

      if (isThisPlaylistPlaying && activeVideo) {
        const newIndex = newVideos.findIndex(v => v.id === activeVideo.id);
        updateGlobalPlaylist(newVideos, newIndex >= 0 ? newIndex : 0);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = videos.findIndex(item => item.id === active.id);
      const newIndex = videos.findIndex(item => item.id === over?.id);
      
      const newVideos = arrayMove(videos, oldIndex, newIndex);
      saveCustomOrder(newVideos);
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);
    }
  };

  const toggleAlphaSort = () => {
    const newDir = alphaSortDir === 'asc' ? 'desc' : 'asc';
    const sorted = [...videos].sort((a, b) => {
      return newDir === 'asc' 
        ? a.title.localeCompare(b.title, 'he')
        : b.title.localeCompare(a.title, 'he');
    });
    setAlphaSortDir(newDir);
    setDateSortDir(null);
    setViewsSortDir(null);
    saveCustomOrder(sorted);
  };

  const toggleDateSort = () => {
    const newDir = dateSortDir === 'asc' ? 'desc' : 'asc';
    const sorted = [...videos].sort((a, b) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return newDir === 'asc' ? timeA - timeB : timeB - timeA;
    });
    setDateSortDir(newDir);
    setAlphaSortDir(null);
    setViewsSortDir(null);
    saveCustomOrder(sorted);
  };

  const toggleViewsSort = () => {
    const newDir = viewsSortDir === 'asc' ? 'desc' : 'asc';
    const sorted = [...videos].sort((a, b) => {
      const viewsA = a.view_count ?? 0;
      const viewsB = b.view_count ?? 0;
      return newDir === 'asc' ? viewsA - viewsB : viewsB - viewsA;
    });
    setViewsSortDir(newDir);
    setDateSortDir(null);
    setAlphaSortDir(null);
    saveCustomOrder(sorted);
  };

  const shuffleVideos = () => {
    const shuffled = [...videos].sort(() => Math.random() - 0.5);
    
    if (isThisPlaylistPlaying && activeVideo) {
      const activeIndex = shuffled.findIndex(v => v.id === activeVideo.id);
      if (activeIndex > -1) {
        const [activeItem] = shuffled.splice(activeIndex, 1);
        shuffled.unshift(activeItem);
      }
    }
    
    saveCustomOrder(shuffled);
    setAlphaSortDir(null);
    setDateSortDir(null);
    setViewsSortDir(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canEdit = user && (user.id === playlist.creator_id || user.email?.toLowerCase() === 'y0527148273@gmail.com');

  const handleVideoClick = (video: VideoRow, index: number) => {
    if (isThisPlaylistPlaying && activeVideo?.id === video.id) {
      // Just toggle play state perhaps, but we don't have toggle in context, so let's just let it be.
      // Wait, we can just call playVideo and it will set isPlaying to true.
    }
    playVideo(playlist.id, videos, index);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Player Section */}
      <div className="flex-1 space-y-6">
        <div ref={containerRef} className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-xl group">
          {activeVideo && (
            <>
              <img 
                src={activeVideo.thumbnail || 'https://picsum.photos/seed/placeholder/1280/720'} 
                alt={activeVideo.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isThisPlaylistPlaying ? 'opacity-0' : 'opacity-100'}`}
                referrerPolicy="no-referrer"
              />
              {!isThisPlaylistPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button 
                    onClick={() => playVideo(playlist.id, videos, globalIndex >= 0 ? globalIndex : 0)}
                    className="w-20 h-20 bg-violet-600 hover:bg-violet-500 hover:scale-105 transition-all rounded-full flex items-center justify-center text-white shadow-2xl"
                  >
                    <Play className="w-10 h-10 ml-2" />
                  </button>
                </div>
              )}
            </>
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
          

        </div>
      </div>

      {/* Playlist Videos */}
      <div className="w-full lg:w-96 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col h-[calc(100vh-8rem)] sticky top-24 shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-white line-clamp-1 flex-1">{playlist.title} ({playlist.videos.length})</h2>
            {canEdit && (
              <button
                onClick={() => router.push(`/edit/${playlist.id}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex-shrink-0"
                title="ערוך פלייליסט"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {user && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button 
                onClick={shuffleVideos}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 hover:text-white"
                title="סדר אקראי"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button 
                onClick={toggleAlphaSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${alphaSortDir ? 'bg-violet-900/40 border-violet-500/50 text-violet-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}
                title="מיון לפי א-ב"
              >
                {alphaSortDir === 'desc' ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
                <span className="text-xs font-medium">א-ב</span>
              </button>
              
              <button 
                onClick={toggleDateSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${dateSortDir ? 'bg-violet-900/40 border-violet-500/50 text-violet-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}
                title="מיון לפי תאריך העלאה"
              >
                <CalendarDays className="w-4 h-4" />
                {dateSortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </button>

              <button 
                onClick={toggleViewsSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${viewsSortDir ? 'bg-violet-900/40 border-violet-500/50 text-violet-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}
                title="מיון לפי פופולריות (צפיות)"
              >
                <Eye className="w-4 h-4" />
                {viewsSortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </button>

              {isCustomOrder && (
                <button 
                  onClick={resetOrder}
                  className="flex items-center justify-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/30 mr-auto"
                  title="חזור לסדר המקורי"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          {user ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={videos.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                {videos.map((video, index) => (
                  <SortablePlaylistItem 
                    key={video.id} 
                    video={video} 
                    index={index}
                    activeVideoId={activeVideo?.id}
                    onClick={() => handleVideoClick(video, index)}
                    isDraggable={true}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            videos.map((video, index) => (
              <SortablePlaylistItem 
                key={video.id} 
                video={video} 
                index={index}
                activeVideoId={activeVideo?.id}
                onClick={() => handleVideoClick(video, index)}
                isDraggable={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
