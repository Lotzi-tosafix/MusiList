"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Music,
  Tag,
  AlertCircle,
  Loader2,
  DownloadCloud,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PlaylistWithSongs } from "@/lib/api";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [totalSongsCount, setTotalSongsCount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [importing, setImporting] = useState(false);
  const [adminTab, setAdminTab] = useState<"playlists" | "channels">("playlists");

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase
      .from("playlists")
      .select("*, playlist_songs(*), channels(title)")
      .order("created_at", { ascending: false });
    if (pData) {
      setPlaylists(pData as any);
    }

    const { data: cData } = await supabase
      .from("channels")
      .select("*")
      .order("title", { ascending: true });
    if (cData) {
      setChannels(cData);
    }

    const { data: sData, count: sCount } = await supabase
      .from("songs")
      .select("*", { count: "exact" });
    if (sData) {
      setSongs(sData);
      setTotalSongsCount(sCount || sData.length);
    }

    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק פלייליסט זה?")) return;

    try {
      await supabase.from("playlist_songs").delete().eq("playlist_id", id);
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (error) throw error;

      setPlaylists(playlists.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Error deleting playlist:", err);
      alert("שגיאה במחיקת הפלייליסט: " + (err.message || ""));
    }
  };

  const handleDeleteChannel = async (id: string, title: string) => {
    if (
      !confirm(
        `האם אתה בטוח שברצונך למחוק את הערוץ "${title}"? פעולה זו תמחק לצמיתות את הערוץ, כל הפלייליסטים שלו וכל השירים שלו.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("channels").delete().eq("id", id);
      if (error) throw error;

      setChannels(channels.filter((c) => c.id !== id));
      fetchData();
    } catch (err: any) {
      console.error("Error deleting channel:", err);
      alert("שגיאה במחיקת הערוץ: " + (err.message || ""));
    }
  };

  const handleImportChannel = async () => {
    if (!channelId) return;
    const ids = channelId.split(",").map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) return;

    setImporting(true);
    const results: { id: string; success: boolean; message?: string; error?: string }[] = [];

    for (const id of ids) {
      try {
        const res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import_channel", channelId: id }),
        });
        const data = await res.json();
        if (data.error) {
          results.push({ id, success: false, error: data.error });
        } else {
          results.push({ id, success: true, message: data.message });
        }
      } catch (err: any) {
        results.push({ id, success: false, error: err.message || err });
      }
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    let alertMsg = `סיום תהליך ייבוא הערוצים!\n\n`;
    if (succeeded.length > 0) {
      alertMsg += `ערוצים שיובאו בהצלחה (${succeeded.length}):\n` + succeeded.map(r => `- ${r.id}`).join("\n") + "\n\n";
    }
    if (failed.length > 0) {
      alertMsg += `ערוצים שנכשלו (${failed.length}):\n` + failed.map(r => `- ${r.id}: ${r.error}`).join("\n");
    }
    alert(alertMsg);
    fetchData();
    setImporting(false);
    setChannelId("");
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/admin",
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.email?.toLowerCase() === "y0527148273@gmail.com";

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          כניסה לממשק ניהול
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {user
            ? `מחובר כ: ${user.email}. אין לך הרשאות ניהול.`
            : "רק מנהלים מורשים יכולים לגשת לעמוד זה."}
        </p>

        {!user && (
          <button
            onClick={handleLogin}
            className="w-full bg-white dark:bg-white hover:bg-slate-50 dark:hover:bg-slate-100 text-slate-900 font-medium py-3 rounded-xl transition-all shadow-lg border border-slate-200 dark:border-transparent flex justify-center items-center gap-3 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/24/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            התחבר עם גוגל
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-display">
            לוח בקרה (Admin)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">שלום, y0527148273@gmail.com</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
        >
          התנתק
        </button>
      </div>

      {/* YouTube Import Card (stretches full width on top) */}
      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0">
            <DownloadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ייבוא ערוץ יוטיוב</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">ניתן להכניס מזהים רבים מופרדים בפסיקים לייבוא מרובה (למשל: UC..., UC...)</p>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:max-w-2xl shrink-0">
          <input
            type="text"
            placeholder="מזהה ערוץ (UC...) או קישור מלא, ניתן להזין כמה מופרדים בפסיק ורווח"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-sans focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleImportChannel}
            disabled={importing || !channelId}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl cursor-pointer transition-all whitespace-nowrap"
          >
            {importing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                מייבא...
              </span>
            ) : (
              "ייבא ערוצים"
            )}
          </button>
        </div>
      </div>

      {/* 3 Summary Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה&quot;כ פלייליסטים
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{playlists.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה&quot;כ ערוצים מיובאים
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{channels.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה&quot;כ שירים באתר
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSongsCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Navigation menu tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setAdminTab("playlists")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === "playlists"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          ניהול פלייליסטים ({playlists.length})
        </button>
        <button
          onClick={() => setAdminTab("channels")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === "channels"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          ניהול ערוצים ({channels.length})
        </button>
      </div>

      {/* Tab Contents: Playlists */}
      {adminTab === "playlists" && (
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">ניהול פלייליסטים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">שם הפלייליסט</th>
                  <th className="px-6 py-4 font-medium">ערוץ/יוצר</th>
                  <th className="px-6 py-4 font-medium">השמעות</th>
                  <th className="px-6 py-4 font-medium">סטטוס</th>
                  <th className="px-6 py-4 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {playlists.map((playlist) => (
                  <tr
                    key={playlist.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {playlist.title}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {(playlist as any).channels?.title || "אנונימי"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {(playlist.play_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30">
                        ציבורי
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold cursor-pointer"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
                {playlists.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      אין פלייליסטים במערכת
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Channels */}
      {adminTab === "channels" && (
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">ניהול ערוצים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">שם הערוץ</th>
                  <th className="px-6 py-4 font-medium">מזהה YouTube</th>
                  <th className="px-6 py-4 font-medium text-center">פלייליסטים</th>
                  <th className="px-6 py-4 font-medium text-center">שירים בודדים</th>
                  <th className="px-6 py-4 font-medium text-center">סה&quot;כ שירים בערוץ</th>
                  <th className="px-6 py-4 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {channels.map((channel) => {
                  const playlistsForChannel = playlists.filter((p) => p.channel_id === channel.id);
                  const songsForChannel = songs.filter((s) => s.channel_id === channel.id);

                  // Create a set of all song IDs that are inside playlists for this specific channel
                  const songsInChannelPlaylists = new Set<string>();
                  playlistsForChannel.forEach((p) => {
                    (p as any).playlist_songs?.forEach((ps: any) => {
                      if (ps.song_id) {
                        songsInChannelPlaylists.add(ps.song_id);
                      }
                    });
                  });

                  const singleSongsCount = songsForChannel.filter((s) => !songsInChannelPlaylists.has(s.id)).length;
                  const totalChannelSongsCount = songsForChannel.length;

                  return (
                    <tr
                      key={channel.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {channel.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {channel.youtube_id}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-center font-bold">
                        {playlistsForChannel.length}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-center font-bold">
                        {singleSongsCount}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-center font-bold">
                        {totalChannelSongsCount}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteChannel(channel.id, channel.title)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium cursor-pointer"
                        >
                          מחק ערוץ וכל תכולתו
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {channels.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      אין ערוצים מיובאים במערכת
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
