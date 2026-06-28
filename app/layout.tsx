import type {Metadata} from 'next';
import { Heebo, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import Header from '@/components/Header';
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
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
