import type {Metadata} from 'next';
import { Heebo, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'MusiList',
  description: 'Share and remix YouTube music playlists',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-100 bg-[#030712] min-h-screen flex flex-col selection:bg-violet-500/30 selection:text-white" suppressHydrationWarning>
        <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-display font-bold text-xl">
                M
              </div>
              <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MusiList</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">ראשי</Link>
              <Link href="/create" className="text-slate-400 hover:text-white transition-colors">יצירת פלייליסט</Link>
              <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">ניהול (Admin)</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
