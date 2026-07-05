"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  LogOut,
  User as UserIcon,
  Search,
  Music,
  Plus,
  List,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
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
);

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const pathname = usePathname() || "";
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const isAdmin = user?.email?.toLowerCase() === "y0527148273@gmail.com";

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-display font-bold text-xl cursor-pointer group-hover:scale-105 transition-transform duration-300">
              <Music className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-slate-400 cursor-pointer">
                מיוזיקלי
              </span>
              <span className="text-[10px] text-violet-600 dark:text-violet-400/80 font-bold tracking-widest uppercase -mt-1 hidden sm:inline">
                קהילת פלייליסטים
              </span>
            </div>
          </Link>
        </div>

        {/* Integrated Quick Search inside Header */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex relative flex-1 max-w-[160px] lg:max-w-[280px] min-w-[100px] shrink"
        >
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="חפש שיר, אמן או פלייליסט"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs pl-4 pr-9 py-2 rounded-full border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-violet-500/60 focus:bg-white dark:focus:bg-slate-950/80 focus:ring-1 focus:ring-violet-500/20 transition-all text-right placeholder:truncate"
            dir="rtl"
          />
        </form>

        {/* Navigation & Controls */}
        <nav className="flex items-center gap-1 sm:gap-4 md:gap-6 text-sm font-medium pb-1 sm:pb-0 shrink-0">
          <Link
            href="/"
            className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
              pathname === "/"
                ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
            title="ראשי"
          >
            <Home className="w-4 h-4 text-violet-500 dark:text-violet-400 sm:hidden" />
            <span className="hidden sm:inline">ראשי</span>
          </Link>

          <Link
            href="/songs"
            className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
              pathname.startsWith("/songs")
                ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
            title="שירים"
          >
            <Music className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span className="hidden sm:inline">שירים</span>
          </Link>

          <Link
            href="/playlists"
            className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
              pathname.startsWith("/playlists")
                ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
            title="פלייליסטים"
          >
            <List className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span className="hidden sm:inline">פלייליסטים</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer shrink-0 ${
                pathname === "/admin"
                  ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40"
              }`}
            >
              ניהול
            </Link>
          )}

          {/* Search Icon on Mobile */}
          <button
            onClick={() => router.push("/search")}
            className="p-1 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white md:hidden cursor-pointer shrink-0"
            title="חיפוש"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-1 sm:p-2 rounded-xl text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all cursor-pointer shrink-0"
            title={theme === "dark" ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700" />
            )}
          </button>

          {/* Auth State */}
          <div className="flex items-center gap-1 sm:gap-2 border-r border-slate-200 dark:border-slate-800/80 pr-1 sm:pr-4 md:pr-6 mr-1 sm:mr-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <div
                  className="flex items-center bg-slate-50 dark:bg-slate-900/80 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 hover:border-violet-500/40 overflow-hidden p-0.5 pl-1 sm:pl-2 shrink-0"
                  onClick={() => router.push("/profile")}
                  title="אזור אישי"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-md hover:scale-105 transition-transform shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                  )}
                  <span className="text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-semibold mr-1.5 hidden sm:inline-block">
                    אזור אישי
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 sm:p-2 rounded-xl hover:bg-red-500/10 cursor-pointer shrink-0"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[11px] sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold transition-all shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 cursor-pointer whitespace-nowrap shrink-0"
              >
                <GoogleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">התחבר עם Google</span>
                <span className="sm:hidden whitespace-nowrap">התחבר</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
