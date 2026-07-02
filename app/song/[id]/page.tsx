"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SongPlaybackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaybackData() {
      try {
        setLoading(true);

        // 1. Try to load from sessionStorage (client-side context queue)
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("musi_playback_queue");
          if (cached) {
            try {
              const parsedQueue = JSON.parse(cached);
              if (Array.isArray(parsedQueue) && parsedQueue.length > 0) {
                // Verify the active song is in the queue
                const activeSong = parsedQueue.find(
                  (s: any) => s.id === id || s.youtube_id === id
                );
                if (activeSong) {
                  setPlaylist({
                    id: `song-queue-${id}`,
                    title: activeSong.title,
                    description: "תור השמעה נוכחי",
                    thumbnail_url: activeSong.thumbnail_url,
                    songs: parsedQueue,
                    created_at: activeSong.created_at || new Date().toISOString(),
                  });
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.error("Error reading queue from session storage", e);
            }
          }
        }

        // 2. Fallback: Fetch song and build fallback queue from Database
        let song: any = null;
        const { data: firstFetch, error: firstErr } = await supabase
          .from("songs")
          .select("*, channels(*)")
          .eq("id", id)
          .maybeSingle();

        if (firstFetch) {
          song = firstFetch;
        } else {
          const { data: fallbackFetch } = await supabase
            .from("songs")
            .select("*, channels(*)")
            .eq("youtube_id", id)
            .maybeSingle();
          song = fallbackFetch;
        }

        if (!song) {
          setError("השיר לא נמצא במערכת.");
          setLoading(false);
          return;
        }

        // Fetch other songs from the same channel to build a natural queue
        let queueSongs = [song];
        if (song.channel_id) {
          const { data: chSongs } = await supabase
            .from("songs")
            .select("*, channels(*)")
            .eq("channel_id", song.channel_id)
            .neq("id", song.id)
            .order("published_at", { ascending: false })
            .limit(20);
          if (chSongs) {
            queueSongs = [...queueSongs, ...chSongs];
          }
        }

        setPlaylist({
          id: `song-queue-${id}`,
          title: song.title,
          description: song.channels?.title
            ? `שיר מאת: ${song.channels.title}`
            : "השמעה יחידה",
          thumbnail_url: song.thumbnail_url,
          songs: queueSongs,
          created_at: song.created_at || new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("Error loading playback data:", err);
        setError("אירעה שגיאה בטעינת השיר.");
      } finally {
        setLoading(false);
      }
    }

    loadPlaybackData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-slate-400 font-sans text-sm">טוען נגן השמעה...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">
          {error || "השיר לא נמצא"}
        </h1>
        <Link
          href="/"
          className="text-violet-400 hover:underline font-medium font-sans"
        >
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  return <PlaylistPlayer playlist={playlist} initialSongId={id} />;
}
