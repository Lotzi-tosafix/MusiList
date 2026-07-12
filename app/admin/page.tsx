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
  ExternalLink,
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
  const [searchResults, setSearchResults] = useState<{ musicArtists: any[]; regularChannels: any[] } | null>(null);
  const [selectedMusicArtist, setSelectedMusicArtist] = useState<string | null>(null);
  const [selectedRegularChannel, setSelectedRegularChannel] = useState<string | null>(null);
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
    setSearchResults(null);
    setSelectedMusicArtist(null);
    setSelectedRegularChannel(null);
    setImportMessage(null);

    try {
      const response = await fetch(`/api/search-artist-yt?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to search");
      setSearchResults({
        musicArtists: data.musicArtists || [],
        regularChannels: data.regularChannels || []
      });
      if (data.musicArtists?.length === 0 && data.regularChannels?.length === 0) {
        setImportMessage({ text: "לא נמצאו תוצאות", type: "error" });
      }
    } catch (err: any) {
      setImportMessage({ text: err.message, type: "error" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportArtist = async (artistIdToImport?: string, regularChannelIdToImport?: string) => {
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
        body: JSON.stringify({ 
          artistId: parsedId,
          regularChannelId: typeof regularChannelIdToImport === 'string' ? regularChannelIdToImport : null
        }),
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

  const handleImportSelected = () => {
    if (!selectedMusicArtist) {
      setImportMessage({ text: "יש לבחור אמן מיוטיוב מיוזיק (טור ימני) כדי להמשיך", type: "error" });
      return;
    }
    handleImportArtist(selectedMusicArtist, selectedRegularChannel || undefined);
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

      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          חיפוש אמן להוספה
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
        {searchResults && (
          <div className="mt-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* יוטיוב מיוזיק - חובה */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-violet-500" />
                    תוצאות YouTube Music <span className="text-xs font-normal text-red-500">(חובה)</span>
                  </span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {searchResults.musicArtists.length > 0 ? (
                    searchResults.musicArtists.map((artist) => (
                      <div 
                        key={artist.id} 
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedMusicArtist === artist.id 
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setSelectedMusicArtist(artist.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedMusicArtist === artist.id ? 'border-violet-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedMusicArtist === artist.id && <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />}
                          </div>
                          
                          {artist.thumbnail ? (
                            <img src={artist.thumbnail} alt={artist.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Users className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{artist.name}</p>
                            {artist.subscribers && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{artist.subscribers}</p>}
                          </div>
                        </div>

                        <a
                          href={`https://music.youtube.com/channel/${artist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          title="צפה ב-YouTube Music"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">לא נמצאו תוצאות</p>
                  )}
                </div>
              </div>

              {/* ערוצים רגילים - רשות */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <ListVideo className="w-5 h-5 text-red-500" />
                    תוצאות ערוצי YouTube <span className="text-xs font-normal text-slate-500">(לפלייליסטים - מומלץ)</span>
                  </span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {searchResults.regularChannels.length > 0 ? (
                    searchResults.regularChannels.map((channel) => (
                      <div 
                        key={channel.id} 
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedRegularChannel === channel.id 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setSelectedRegularChannel(selectedRegularChannel === channel.id ? null : channel.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 ${
                            selectedRegularChannel === channel.id ? 'border-red-500 bg-red-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedRegularChannel === channel.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          
                          {channel.thumbnail ? (
                            <img src={channel.thumbnail} alt={channel.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Users className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{channel.name}</p>
                            {channel.subscribers && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{channel.subscribers}</p>}
                          </div>
                        </div>

                        <a
                          href={`https://youtube.com/channel/${channel.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          title="צפה ב-YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">לא נמצאו תוצאות</p>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleImportSelected}
                disabled={importing || !selectedMusicArtist}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow-md shadow-violet-600/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : "ייבא בחירות"}
              </button>
            </div>
          </div>
        )}
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
