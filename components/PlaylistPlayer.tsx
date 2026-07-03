"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Play,
  Copy,
  Clock,
  Loader2,
  GripVertical,
  Shuffle,
  RotateCcw,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Heart,
} from "lucide-react";
import { PlaylistWithSongs, SongRow } from "@/lib/api";
import { usePlayer } from "@/lib/PlayerContext";
import YouTube from "react-youtube";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePlaylistItem({
  song,
  activeSongId,
  index,
  onClick,
  isDraggable,
}: {
  song: SongRow;
  activeSongId: string | undefined;
  index: number;
  onClick: () => void;
  isDraggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
        activeSongId === song.id
          ? "bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-500/30"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
      }`}
    >
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-slate-900 dark:hover:text-white text-slate-500 p-1"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <button onClick={onClick} className="flex-1 flex gap-3 text-right">
        <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
          <img
            src={
              song.thumbnail_url ||
              "https://picsum.photos/seed/placeholder/640/360"
            }
            alt={song.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {activeSongId === song.id && (
            <div className="absolute inset-0 bg-violet-600/40 flex items-center justify-center">
              <Play className="w-6 h-6 text-white drop-shadow-md" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p
            className={`text-sm font-medium line-clamp-2 ${activeSongId === song.id ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}
          >
            {index + 1}. {song.title}
          </p>
        </div>
      </button>
    </div>
  );
}

export default function PlaylistPlayer({
  playlist,
  initialSongId,
}: {
  playlist: PlaylistWithSongs;
  initialSongId?: string;
}) {
  const router = useRouter();
  const {
    playlistId: globalPlaylistId,
    videos: globalSongs,
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
    updateGlobalPlaylist,
  } = usePlayer();
  const [user, setUser] = useState<User | null>(null);

  const [songs, setSongs] = useState<SongRow[]>([]);
  const [isCustomOrder, setIsCustomOrder] = useState(false);

  const [alphaSortDir, setAlphaSortDir] = useState<"asc" | "desc" | null>(null);
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc" | null>(null);
  const [viewsSortDir, setViewsSortDir] = useState<"asc" | "desc" | null>(null);
  const [likesSortDir, setLikesSortDir] = useState<"asc" | "desc" | null>(null);

  // Define activeSong based on global state if this is the active playlist
  const isThisPlaylistPlaying = globalPlaylistId === playlist.id;
  const activeSong =
    isThisPlaylistPlaying && globalIndex >= 0
      ? globalSongs[globalIndex]
      : songs.length > 0
        ? songs[0]
        : null;

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (songs.length > 0 && !isThisPlaylistPlaying) {
      let startIndex = 0;
      if (initialSongId) {
        const foundIndex = songs.findIndex((s) => s.id === initialSongId || s.youtube_id === initialSongId);
        if (foundIndex >= 0) {
          startIndex = foundIndex;
        }
      }
      playVideo(playlist.id, songs, startIndex);
    }
  }, [songs, isThisPlaylistPlaying, playlist.id, playVideo, initialSongId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
        const savedOrder = localStorage.getItem(key);
        if (savedOrder) {
          try {
            const orderIds = JSON.parse(savedOrder) as string[];
            const newSongs = [...(playlist.songs || [])].sort(
              (a: any, b: any) => {
                const idxA = orderIds.indexOf(a.id);
                const idxB = orderIds.indexOf(b.id);
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
              },
            );
            setSongs(newSongs);
            setIsCustomOrder(true);
          } catch (e) {
            setSongs([...(playlist.songs || [])]);
          }
        } else {
          setSongs([...(playlist.songs || [])]);
        }
      } else {
        setSongs([...(playlist.songs || [])]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, playlist]);

  const saveCustomOrder = (newSongs: SongRow[]) => {
    setSongs(newSongs);
    if (user) {
      const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
      localStorage.setItem(key, JSON.stringify(newSongs.map((v) => v.id)));
      setIsCustomOrder(true);
    }
    if (isThisPlaylistPlaying && activeSong) {
      const newIndex = newSongs.findIndex((v) => v.id === activeSong.id);
      updateGlobalPlaylist(newSongs, newIndex >= 0 ? newIndex : 0);
    }
  };

  const resetOrder = () => {
    if (confirm("האם אתה בטוח שברצונך לחזור לסדר המקורי של הפלייליסט?")) {
      if (user) {
        const key = `MusiList_custom_order_${user.id}_${playlist.id}`;
        localStorage.removeItem(key);
      }
      const newSongs = [...(playlist.songs || [])];
      setSongs(newSongs);
      setIsCustomOrder(false);
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);
      setLikesSortDir(null);

      if (isThisPlaylistPlaying && activeSong) {
        const newIndex = newSongs.findIndex((v) => v.id === activeSong.id);
        updateGlobalPlaylist(newSongs, newIndex >= 0 ? newIndex : 0);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = songs.findIndex((item) => item.id === active.id);
      const newIndex = songs.findIndex((item) => item.id === over?.id);

      const newSongs = arrayMove(songs, oldIndex, newIndex);
      saveCustomOrder(newSongs);
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);
      setLikesSortDir(null);
    }
  };

  const toggleAlphaSort = () => {
    const newDir = alphaSortDir === "asc" ? "desc" : "asc";
    const sorted = [...songs].sort((a, b) => {
      return newDir === "asc"
        ? a.title.localeCompare(b.title, "he")
        : b.title.localeCompare(a.title, "he");
    });
    setAlphaSortDir(newDir);
    setDateSortDir(null);
    setViewsSortDir(null);
    setLikesSortDir(null);
    saveCustomOrder(sorted);
  };

  const toggleDateSort = () => {
    const newDir = dateSortDir === "asc" ? "desc" : "asc";
    const sorted = [...songs].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return newDir === "asc" ? timeA - timeB : timeB - timeA;
    });
    setDateSortDir(newDir);
    setAlphaSortDir(null);
    setViewsSortDir(null);
    setLikesSortDir(null);
    saveCustomOrder(sorted);
  };

  const toggleViewsSort = () => {
    const newDir = viewsSortDir === "asc" ? "desc" : "asc";
    const sorted = [...songs].sort((a, b) => {
      const viewsA = a.play_count ?? 0;
      const viewsB = b.play_count ?? 0;
      return newDir === "asc" ? viewsA - viewsB : viewsB - viewsA;
    });
    setViewsSortDir(newDir);
    setDateSortDir(null);
    setAlphaSortDir(null);
    setLikesSortDir(null);
    saveCustomOrder(sorted);
  };

  const toggleLikesSort = () => {
    const newDir = likesSortDir === "asc" ? "desc" : "asc";
    const sorted = [...songs].sort((a, b) => {
      const likesA = (a as any).likes_count ?? 0;
      const likesB = (b as any).likes_count ?? 0;
      return newDir === "asc" ? likesA - likesB : likesB - likesA;
    });
    setLikesSortDir(newDir);
    setViewsSortDir(null);
    setDateSortDir(null);
    setAlphaSortDir(null);
    saveCustomOrder(sorted);
  };

  const shuffleSongs = () => {
    const shuffled = [...songs].sort(() => Math.random() - 0.5);

    if (isThisPlaylistPlaying && activeSong) {
      const activeIndex = shuffled.findIndex((v) => v.id === activeSong.id);
      if (activeIndex > -1) {
        const [activeItem] = shuffled.splice(activeIndex, 1);
        shuffled.unshift(activeItem);
      }
    }

    saveCustomOrder(shuffled);
    setAlphaSortDir(null);
    setDateSortDir(null);
    setViewsSortDir(null);
    setLikesSortDir(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const canEdit = false; // Admins only for now

  const handleSongClick = (song: SongRow, index: number) => {
    playVideo(playlist.id, songs, index);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-8">
      {/* Player Section */}
      <div className="flex-1 space-y-6">
        <div
          ref={containerRef}
          className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-xl group"
        >
          {activeSong && (
            <>
              <img
                src={
                  activeSong.thumbnail_url ||
                  "https://picsum.photos/seed/placeholder/1280/720"
                }
                alt={activeSong.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isThisPlaylistPlaying ? "opacity-0" : "opacity-100"}`}
                referrerPolicy="no-referrer"
              />
              {!isThisPlaylistPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={() =>
                      playVideo(
                        playlist.id,
                        songs,
                        globalIndex >= 0 ? globalIndex : 0,
                      )
                    }
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {playlist.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{playlist.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
            <div className="flex items-center gap-1">
              <Play className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              {(playlist.play_count || 0).toLocaleString()} השמעות
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              נוצר לאחרונה
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Videos */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-8rem)] sticky top-0 lg:top-8 shadow-md dark:shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">
              {playlist.title} ({(playlist.songs || []).length})
            </h2>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={shuffleSongs}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                title="סדר אקראי"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={toggleAlphaSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${alphaSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                title="מיון לפי א-ב"
              >
                {alphaSortDir === "desc" ? (
                  <ArrowUpAZ className="w-4 h-4" />
                ) : (
                  <ArrowDownAZ className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">א-ב</span>
              </button>

              <button
                onClick={toggleDateSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${dateSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                title="מיון לפי תאריך העלאה"
              >
                <CalendarDays className="w-4 h-4" />
                {dateSortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={toggleViewsSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${viewsSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                title="מיון לפי פופולריות (השמעות)"
              >
                <Eye className="w-4 h-4" />
                {viewsSortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={toggleLikesSort}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border ${likesSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                title="מיון לפי לייקים"
              >
                <Heart className={`w-4 h-4 ${likesSortDir ? "text-violet-600 dark:text-violet-400 fill-violet-600 dark:fill-violet-400" : "text-slate-500 dark:text-slate-400"}`} />
                {likesSortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
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
                items={songs.map((v) => v.id)}
                strategy={verticalListSortingStrategy}
              >
                {songs.map((song, index) => (
                  <SortablePlaylistItem
                    key={song.id}
                    song={song}
                    index={index}
                    activeSongId={activeSong?.id}
                    onClick={() => handleSongClick(song, index)}
                    isDraggable={true}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            songs.map((song, index) => (
              <SortablePlaylistItem
                key={song.id}
                song={song}
                index={index}
                activeSongId={activeSong?.id}
                onClick={() => handleSongClick(song, index)}
                isDraggable={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
