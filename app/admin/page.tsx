"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ListVideo,
  Music,
  Users,
  Search,
} from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // States for importing
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // States for searching
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Stats & Data
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  
  const [adminTab, setAdminTab] = useState<"playlists" | "artists">("playlists");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (
        session?.user?.email === "y0527148273@gmail.com" ||
        session?.user?.email === "admin@example.com"
      ) {
        setIsAdmin(true);
        loadDashboardData();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      const [plRes, artRes, songRes] = await Promise.all([
        supabase
          .from("playlists")
          .select("*, playlist_songs(*), artists(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("artists")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("songs").select("*"),
      ]);

      if (plRes.data) setPlaylists(plRes.data);
      if (artRes.data) setArtists(artRes.data);
      if (songRes.data) setSongs(songRes.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchArtist = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setImportMessage(null);

    try {
      const response = await fetch(`/api/search-artist-yt?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to search");
      setSearchResults(data.artists || []);
      if (data.artists?.length === 0) {
        setImportMessage({ text: "לא נמצאו תוצאות", type: "error" });
      }
    } catch (err: any) {
      setImportMessage({ text: err.message, type: "error" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportArtist = async (artistIdToImport?: string) => {
    const finalId = typeof artistIdToImport === 'string' ? artistIdToImport : importUrl;
    if (!finalId) return;
    setImporting(true);
    setImportMessage(null);

    let parsedId = finalId;

    if (finalId.includes("youtube.com") || finalId.includes("youtu.be")) {
      try {
        const urlObj = new URL(importUrl);
        if (urlObj.pathname.startsWith("/channel/")) {
          parsedId = urlObj.pathname.split("/")[2];
        } else {
          setImportMessage({
            text: "אנא ספק מזהה ערוץ או קישור ישיר לערוץ (לדוגמה: https://youtube.com/channel/UC...)",
            type: "error",
          });
          setImporting(false);
          return;
        }
      } catch (e) {
        // Fallback if URL parsing fails
      }
    }

    try {
      const response = await fetch("/api/import-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: parsedId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import artist");
      }

      setImportMessage({
        text: `אמן '${data.artistName}' יובא בהצלחה! השירים והאלבומים התווספו למערכת.`,
        type: "success",
      });
      setImportUrl("");
      loadDashboardData();
    } catch (err: any) {
      setImportMessage({ text: err.message, type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק פלייליסט זה?")) {
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (!error) {
        setPlaylists(playlists.filter((p) => p.id !== id));
      }
    }
  };

  const handleDeleteArtist = async (id: string, name: string) => {
    if (
      confirm(
        `אזהרה חמורה: מחיקת האמן "${name}" תמחק גם את כל האלבומים והשירים המקושרים אליו במערכת. האם אתה בטוח שברצונך להמשיך?`
      )
    ) {
      const { error } = await supabase.from("artists").delete().eq("id", id);
      if (!error) {
        setArtists(artists.filter((a) => a.id !== id));
        loadDashboardData(); // Reload to refresh playlists and songs
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          אין לך הרשאות ניהול
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            לוח בקרה - מנהל
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            ניהול אמנים, פלייליסטים ושירים במערכת.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          רענן נתונים
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה"כ פלייליסטים ואלבומים
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {playlists.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה"כ אמנים
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {artists.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              סה"כ שירים במערכת
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {songs.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            חיפוש אמן להוספה (מומלץ)
          </h2>
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchArtist()}
                placeholder='חפש אמן לייבוא (לדוגמה: "ישי ריבו")'
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-right text-sm"
              />
              <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            </div>
            <button
              onClick={handleSearchArtist}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "חפש"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-4 mt-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {searchResults.map((artist) => (
                <div key={artist.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 hover:border-violet-500/30 dark:hover:border-violet-500/30 transition-all shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right w-full sm:w-auto">
                    {artist.thumbnail ? (
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-violet-500/20 shadow-md group shrink-0">
                        <img 
                          src={artist.thumbnail} 
                          alt={artist.name} 
                          className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0 shadow-inner">
                        <Users className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white mb-1">{artist.name}</p>
                      {artist.subscribers && (
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {artist.subscribers}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px] sm:max-w-xs" dir="ltr">
                        ID: {artist.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleImportArtist(artist.id)}
                    disabled={importing}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ייבא אמן זה
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            הזנה ישירה (למתקדמים)
          </h2>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="קישור/מזהה (לדוגמה: UC...)"
                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-left dir-ltr font-mono text-sm"
                dir="ltr"
              />
              <LinkIcon className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
            </div>
            <button
              onClick={() => handleImportArtist()}
              disabled={importing || !importUrl}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : "ייבא מקישור"}
            </button>
          </div>
        </div>
      </div>
      
      {importMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            importMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30"
          }`}
        >
          {importMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="font-medium text-sm">{importMessage.text}</p>
        </div>
      )}

      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setAdminTab("playlists")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === "playlists"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          ניהול פלייליסטים ואלבומים ({playlists.length})
        </button>
        <button
          onClick={() => setAdminTab("artists")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            adminTab === "artists"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          ניהול אמנים ({artists.length})
        </button>
      </div>

      {adminTab === "playlists" && (
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">ניהול פלייליסטים ואלבומים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">שם אלבום/פלייליסט</th>
                  <th className="px-6 py-4 font-medium">אמן</th>
                  <th className="px-6 py-4 font-medium">סוג</th>
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
                      {(playlist as any).artists?.name || "אנונימי"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {playlist.type}
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
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      אין נתונים במערכת
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === "artists" && (
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">ניהול אמנים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">שם האמן</th>
                  <th className="px-6 py-4 font-medium">מזהה YouTube</th>
                  <th className="px-6 py-4 font-medium text-center">פלייליסטים ואלבומים</th>
                  <th className="px-6 py-4 font-medium text-center">סה"כ שירים</th>
                  <th className="px-6 py-4 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {artists.map((artist) => {
                  const playlistsForArtist = playlists.filter((p) => p.artist_id === artist.id);
                  const songsForArtist = songs.filter((s) => s.artist_id === artist.id);
                  const totalArtistSongsCount = songsForArtist.length;

                  return (
                    <tr
                      key={artist.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {artist.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {artist.youtube_id}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-center font-bold">
                        {playlistsForArtist.length}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-center font-bold">
                        {totalArtistSongsCount}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteArtist(artist.id, artist.name)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium cursor-pointer"
                        >
                          מחק אמן וכל תכולתו
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {artists.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      אין אמנים במערכת
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
