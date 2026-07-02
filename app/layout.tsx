import type { Metadata } from "next";
import { Heebo, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import { PlayerProvider } from "@/lib/PlayerContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "מיוזיקלי",
  description: "קהילת שירים ופלייליסטים מיוטיוב",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('musi_theme');
                var theme = savedTheme || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#030712] min-h-screen flex flex-col selection:bg-violet-500/30 selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <PlayerProvider>
            <Header />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
              {children}
            </main>
            <GlobalPlayer />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
