"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  User as UserIcon,
  Settings,
  Music,
  Globe,
  Lock,
  Trash2,
  Edit,
  Play,
  Plus,
  Loader2,
  Shield,
  Volume2,
  Tv,
  Check,
  ExternalLink,
  AlertCircle,
  Eye,
  LogOut,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PlaylistWithSongs } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUserPlaylists = async (userId: string) => {
    setPlaylistsLoading(true);
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select(
          `
          *,
          playlist_songs (
            position,
            songs (*)
          )
        `
        )
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user playlists:", error);
      } else {
        const formatted = (data as any[] || []).map((pl) => {
          const songs = (pl.playlist_songs || [])
            .map((ps: any) => ({ ...ps.songs, position: ps.position }))
            .sort((a: any, b: any) => a.position - b.position);
          return { ...pl, songs };
        }) as PlaylistWithSongs[];
        setPlaylists(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        fetchUserPlaylists(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        fetchUserPlaylists(session.user.id);
      } else {
        setPlaylists([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdateSetting = (key: string, value: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(value));
      showToast("ההגדרה נשמרה בהצלחה!");
      if (key === "pref_audio_only") {
        window.dispatchEvent(new Event("pref_audio_only_changed"));
      }
    }
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק פלייליסט זה? פעולה זו אינה הפיכה.")) return;
    setDeletingId(playlistId);
    setErrorMsg("");

    try {
      // 1. Delete songs links
      const { error: songsError } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId);

      if (songsError) throw songsError;

      // 2. Delete playlist
      const { error: playlistError } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId)
        .eq("creator_id", user?.id);

      if (playlistError) throw playlistError;

      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      showToast("הפלייליסט נמחק בהצלחה!");
    } catch (err: any) {
      console.error("Error deleting playlist:", err);
      setErrorMsg("אירעה שגיאה במחיקת הפלייליסט: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 dark:text-violet-500 animate-spin" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">טוען פרופיל...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-slate-900/60 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">אזור אישי</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
          כדי ליהנות מאזור אישי, לערוך הגדרות ולנהל את הפלייליסטים האישיים שלך, אנא התחבר למערכת.
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 cursor-pointer"
        >
          <span>התחבר עם Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-10">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-fade-in font-medium">
          <Check className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 bg-rose-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-fade-in font-medium">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* User Hero Banner */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-violet-500/30 shadow-lg">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <UserIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </h1>
              <span className="bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-violet-700 dark:fill-violet-300" />
                משתמש רשום
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">{user.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              הצטרף בתאריך: {new Date(user.created_at).toLocaleDateString("he-IL")}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-sm font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק מהחשבון</span>
          </button>
        </div>
      </div>

      {/* Personal Playlists Container */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <Music className="w-5 h-5 text-violet-500 animate-pulse" />
              <span>הפלייליסטים האישיים שלי ({playlists.length})</span>
            </h2>

            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-violet-600/10 hover:shadow-violet-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ייבוא פלייליסט</span>
            </Link>
          </div>

          {playlistsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
              <span className="text-xs">טוען את הפלייליסטים שלך...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">אין לך פלייליסטים עדיין</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                כאן יופיעו רק הפלייליסטים האישיים שאתה יצרת. תוכל לייבא בקלות פלייליסטים מיוטיוב באמצעות לחיצה על הכפתור למעלה.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist: any) => {
                  const songCount = playlist.songs?.length || 0;
                  const firstSongWithThumb = playlist.songs?.find((s: any) => s.thumbnail_url || s.thumbnail);
                  const thumbnail = firstSongWithThumb?.thumbnail_url || (firstSongWithThumb as any)?.thumbnail || "https://picsum.photos/seed/playlist/640/360";

                  return (
                    <div
                      key={playlist.id}
                      className="group bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:border-violet-500/50 hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail cover */}
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3.5 bg-slate-200 dark:bg-slate-950">
                          <img
                            src={thumbnail}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                            <span className="text-white text-xs font-semibold flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                              <Eye className="w-3.5 h-3.5" />
                              {playlist.play_count || 0} צפיות
                            </span>
                          </div>

                          {/* Privacy Badge */}
                          <div className="absolute top-2.5 left-2.5">
                            {playlist.is_public ? (
                              <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1 backdrop-blur-sm shadow-md">
                                <Globe className="w-3 h-3" />
                                <span>ציבורי</span>
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1 backdrop-blur-sm shadow-md">
                                <Lock className="w-3 h-3" />
                                <span>פרטי</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1 text-base">
                          {playlist.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                          {playlist.description || "אין תיאור לפלייליסט זה."}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 font-mono">
                          <span>{songCount} שירים</span>
                          <span>•</span>
                          <span>נוצר ב: {new Date(playlist.created_at).toLocaleDateString("he-IL")}</span>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                        <Link
                          href={`/playlist/${playlist.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>נגן</span>
                        </Link>
                        
                        <Link
                          href={`/edit/${playlist.id}`}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                          title="ערוך פלייליסט"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          disabled={deletingId === playlist.id}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                          title="מחק פלייליסט"
                        >
                          {deletingId === playlist.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
  );
}
