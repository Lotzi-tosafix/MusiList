'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/24/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  
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
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-display font-bold text-xl cursor-pointer">
              M
            </div>
            <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 cursor-pointer">MusiList</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors cursor-pointer">ראשי</Link>
          <Link href="/create" className="text-slate-400 hover:text-white transition-colors cursor-pointer">יצירת פלייליסט</Link>
          {isAdmin && (
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors cursor-pointer">ניהול</Link>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center bg-slate-900 rounded-full cursor-pointer hover:bg-slate-800 transition-all border border-slate-700/50 overflow-hidden"
                onClick={() => setShowEmail(!showEmail)}
              >
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${showEmail ? 'max-w-[200px] pl-3 pr-4 opacity-100' : 'max-w-0 px-0 opacity-0'}`}
                >
                  <span className="text-slate-300 text-sm font-medium">{user.email}</span>
                </div>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full z-10 relative shadow-md" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 z-10 relative shadow-md">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-500/10 cursor-pointer" title="התנתק">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-full font-medium transition-colors shadow-sm cursor-pointer">
              <GoogleIcon className="w-4 h-4" />
              התחבר
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
