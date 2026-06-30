'use client';

import { useState, useEffect } from 'react';
import { Settings, Users, Music, Tag, AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('channels').select('*').order('last_sync_at', { ascending: false });
    if (cData) {
      setChannels(cData);
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

  const handleImportChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const res = await fetch('/api/youtube/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: importUrl })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בייבוא הערוץ');
      }

      setImportSuccess('הערוץ יובא בהצלחה! השירים מסתנכרנים ברקע.');
      setImportUrl('');
      fetchData(); // Refresh list
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק ערוץ זה? כל השירים והפלייליסטים שלו יימחקו גם כן.')) return;
    
    try {
      const { error } = await supabase.from('channels').delete().eq('id', id);
      if (error) throw error;
      setChannels(channels.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting channel:', err);
      alert('שגיאה במחיקת הערוץ: ' + (err.message || ''));
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
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/24/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
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
          <h1 className="text-3xl font-bold text-white mb-2">לוח בקרה (Admin) - MusicLi</h1>
          <p className="text-slate-400">שלום, y0527148273@gmail.com</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          התנתק
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-900/30 text-violet-400 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">סה&quot;כ ערוצים</p>
            <p className="text-2xl font-bold text-white">{channels.length}</p>
          </div>
        </div>
        
        {/* Import Form */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm">
           <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-violet-400"/> ייבוא ערוץ חדש</h2>
           <form onSubmit={handleImportChannel} className="flex gap-2">
             <input 
                type="text" 
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="קישור לערוץ ביוטיוב (לדוגמה /channel/UC...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                dir="ltr"
             />
             <button
               type="submit"
               disabled={importing || !importUrl}
               className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
             >
               {importing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
               ייבא
             </button>
           </form>
           {importError && <p className="text-red-400 text-sm mt-3 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {importError}</p>}
           {importSuccess && <p className="text-green-400 text-sm mt-3">{importSuccess}</p>}
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">ניהול ערוצים</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">ערוץ</th>
                <th className="px-6 py-4 font-medium">מזהה</th>
                <th className="px-6 py-4 font-medium">סנכרון אחרון</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {channels.map((channel) => (
                <tr key={channel.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    {channel.thumbnail ? <img src={channel.thumbnail} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-800" />}
                    {channel.title}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{channel.id}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(channel.last_sync_at).toLocaleDateString('he-IL')}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteChannel(channel.id)} className="text-red-400 hover:text-red-300 font-medium">מחק</button>
                  </td>
                </tr>
              ))}
              {channels.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    אין ערוצים במערכת
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
