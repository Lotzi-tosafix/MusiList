'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = user?.email?.toLowerCase() === 'y0527148273@gmail.com';

  return (
    <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-display font-bold text-xl">
              M
            </div>
            <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MusiList</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">ראשי</Link>
          <Link href="/create" className="text-slate-400 hover:text-white transition-colors">יצירת פלייליסט</Link>
          {isAdmin && (
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">ניהול</Link>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-400 hidden sm:inline-block">{user.email}</span>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">התנתק</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-violet-400 hover:text-violet-300 transition-colors">
              התחבר עם גוגל
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
