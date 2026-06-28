'use client';

import { useState, useEffect } from 'react';
import { Youtube, Search, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const POPULAR_TAGS = ["שבת", "חג", "שקט", "דאנס", "אברהם פריד", "חנן בן ארי", "ישי ריבו", "קצבי", "רגש", "ווקאלי", "למידה"];

export default function CreatePlaylist() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const suggestedTags = POPULAR_TAGS.filter(t => t.includes(tagInput) && !tags.includes(t));

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בייבוא הפלייליסט');
      }
      
      setPlaylistData(data);
      setPlaylistTitle(data.title);
      setPlaylistDescription(data.description || '');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!playlistData || !playlistTitle) return;
    setLoading(true);
    setError('');
    
    try {
      // 1. Insert Playlist
      const { data: newPlaylist, error: playlistError } = await (supabase as any)
        .from('playlists')
        .insert([{
          title: playlistTitle,
          description: playlistDescription,
          tags,
          is_public: true,
          play_count: 0,
          creator_id: user?.id || null
        }])
        .select()
        .single();
        
      if (playlistError) throw new Error('שגיאה בשמירת הפלייליסט: ' + playlistError.message);
      
      // 2. Insert Videos
      const videosToInsert = playlistData.videos.map((v: any) => ({
        playlist_id: newPlaylist.id,
        youtube_id: v.youtube_id,
        title: v.title,
        thumbnail: v.thumbnail,
        position: v.position
      }));
      
      const { error: videosError } = await (supabase as any)
        .from('videos')
        .insert(videosToInsert);
        
      if (videosError) throw new Error('שגיאה בשמירת הסרטונים: ' + videosError.message);
      
      // 3. Redirect to the new playlist
      router.push(`/playlist/${newPlaylist.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-800 text-center">
        <div className="w-16 h-16 bg-violet-900/50 text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Youtube className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">ייבוא פלייליסט</h1>
        <p className="text-slate-400 mb-8">
          כדי לייבא ולערוך פלייליסטים, אנא התחבר לחשבונך.
        </p>
        
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/create' } })}
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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-slate-900/60 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">
          {step === 1 ? 'ייבוא פלייליסט' : 'הגדרות פלייליסט'}
        </h1>
        <p className="text-slate-400 mb-8">
          {step === 1 ? 'הכנס קישור לפלייליסט מיוטיוב כדי להתחיל' : 'הוסף תגיות ותיאור כדי שאחרים יוכלו למצוא אותו'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleImport} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-red-500">
                <Youtube className="w-6 h-6" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full pl-4 pr-12 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-left dir-ltr shadow-inner"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>משוך סרטונים</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">שם הפלייליסט (יובא אוטומטית)</label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-violet-500 outline-none shadow-inner"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">תגיות (השלמה חכמה)</label>
              <div className="p-2 border border-slate-700 rounded-xl focus-within:border-violet-500 bg-slate-900 shadow-inner">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-violet-900/50 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full text-sm font-medium">
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                  placeholder="הוסף תגית (למשל: שבת, קצבי)..."
                  className="w-full outline-none p-2 bg-transparent text-white placeholder-slate-500"
                />
              </div>
              {tagInput && suggestedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-400 w-full mb-1">הצעות מתאימות:</span>
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="flex items-center gap-1 text-sm bg-slate-900 border border-slate-700 text-slate-400 px-3 py-1.5 rounded-full hover:border-violet-500 hover:text-violet-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 text-slate-400 font-medium hover:bg-slate-800 hover:text-white rounded-xl transition-colors border border-transparent hover:border-slate-700"
              >
                חזור
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-2 w-2/3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'שמור פלייליסט'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
