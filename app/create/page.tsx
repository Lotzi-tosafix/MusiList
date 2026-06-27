'use client';

import { useState } from 'react';
import { Youtube, Search, Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const POPULAR_TAGS = ["שבת", "חג", "שקט", "דאנס", "אברהם פריד", "חנן בן ארי", "ישי ריבו", "קצבי", "רגש", "ווקאלי", "למידה"];

export default function CreatePlaylist() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const suggestedTags = POPULAR_TAGS.filter(t => t.includes(tagInput) && !tags.includes(t));

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/playlist/pl_1'); // Redirect to a mock playlist for demo
    }, 1000);
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-slate-900/60 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">
          {step === 1 ? 'ייבוא פלייליסט' : 'הגדרות פלייליסט'}
        </h1>
        <p className="text-slate-400 mb-8">
          {step === 1 ? 'הכנס קישור לפלייליסט מיוטיוב כדי להתחיל' : 'הוסף תגיות ותיאור כדי שאחרים יוכלו למצוא אותו'}
        </p>

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
                defaultValue="הפלייליסט החדש שלי"
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
