'use client';

import { useState, useEffect } from 'react';
import { Settings, Users, Music, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PlaylistWithVideos } from '@/lib/api';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithVideos[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('playlists').select('*, videos(*)').order('created_at', { ascending: false });
    if (pData) {
      setPlaylists(pData as any);
      
      const tagSet = new Set<string>();
      (pData as any[]).forEach(row => {
        if (row.tags) row.tags.forEach((tag: string) => tagSet.add(tag));
      });
      setTags(Array.from(tagSet));
    }
    setLoading(false);
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פלייליסט זה?')) return;
    
    try {
      await supabase.from('playlist_plays').delete().eq('playlist_id', id);
      await supabase.from('videos').delete().eq('playlist_id', id);
      
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
      
      setPlaylists(playlists.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting playlist:', err);
      alert('שגיאה במחיקת הפלייליסט: ' + (err.message || ''));
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin',
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

  const isAdmin = user?.email?.toLowerCase() === 'y0527148273@gmail.com';

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-800 text-center">
        <div className="w-16 h-16 bg-violet-900/50 text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">כניסה לממשק ניהול</h1>
        <p className="text-slate-400 mb-8">
          {user ? `מחובר כ: ${user.email}. אין לך הרשאות ניהול.` : 'רק מנהלים מורשים יכולים לגשת לעמוד זה.'}
        </p>
        
        {!user && (
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20 flex justify-center items-center gap-2"
          >
            התחבר עם גוגל
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">לוח בקרה (Admin)</h1>
          <p className="text-slate-400">שלום, y0527148273@gmail.com</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          התנתק
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-900/30 text-violet-400 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">סה&quot;כ פלייליסטים</p>
            <p className="text-2xl font-bold text-white">{playlists.length}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-900/30 text-cyan-400 rounded-xl flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">תגיות פעילות</p>
            <p className="text-2xl font-bold text-white">{tags.length}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">משתמשים רשומים</p>
            <p className="text-2xl font-bold text-white">3</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">ניהול פלייליסטים</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">שם הפלייליסט</th>
                <th className="px-6 py-4 font-medium">יוצר</th>
                <th className="px-6 py-4 font-medium">השמעות</th>
                <th className="px-6 py-4 font-medium">סטטוס</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {playlists.map((playlist) => (
                <tr key={playlist.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{playlist.title}</td>
                  <td className="px-6 py-4 text-slate-400">{playlist.creator_id || 'אנונימי'}</td>
                  <td className="px-6 py-4 text-slate-400">{(playlist.play_count || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      playlist.is_public ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {playlist.is_public ? 'ציבורי' : 'פרטי'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeletePlaylist(playlist.id)} className="text-red-400 hover:text-red-300 font-medium">מחק</button>
                  </td>
                </tr>
              ))}
              {playlists.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    אין פלייליסטים במערכת
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
