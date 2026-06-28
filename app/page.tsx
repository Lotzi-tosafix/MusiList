import { Play, TrendingUp, Music, ListMusic, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getTrendingPlaylists, getAllTags } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const trendingPlaylists = await getTrendingPlaylists();
  const allTags = await getAllTags();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 bg-slate-950/50 rounded-3xl border border-slate-800/50 shadow-2xl">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          המוזיקה שלך, <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">בדרך שלך</span>.
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          גלה, שתף וערוך פלייליסטים מיוטיוב. המקום המושלם למוזיקה יהודית, חסידית וישראלית - בלי הגבלות ועם חווית משתמש מושלמת.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/create"
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>ייבוא פלייליסט מיוטיוב</span>
          </Link>
          <a
            href="#explore"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-8 py-4 rounded-full font-medium transition-colors"
          >
            <Music className="w-5 h-5" />
            <span>גלה פלייליסטים</span>
          </a>
        </div>
      </section>

      {/* Tags Carousel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-violet-400" />
            קטגוריות חמות
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              className="px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-sm font-medium hover:border-violet-500 hover:text-white transition-colors shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Trending Playlists */}
      <section id="explore">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-violet-400" />
            הכי הושמעו השבוע
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingPlaylists.map(playlist => (
            <Link href={`/playlist/${playlist.id}`} key={playlist.id} className="group flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden hover:bg-slate-800/40 transition-all duration-300">
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                <Image
                  src={playlist.videos[0]?.thumbnail || 'https://picsum.photos/seed/placeholder/640/360'}
                  alt={playlist.title}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-violet-600 text-white text-[10px] px-2 py-1 rounded font-bold">
                  {playlist.videos.length} סרטונים
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-violet-400 transition-colors">
                  {playlist.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
                  {playlist.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {(playlist.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] font-medium text-slate-500 px-2 py-1 uppercase">
                        #{tag}
                      </span>
                    ))}
                    {(playlist.tags || []).length > 2 && (
                      <span className="text-[10px] font-medium text-slate-500 px-2 py-1 uppercase">
                        +{(playlist.tags || []).length - 2}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Play className="w-3 h-3 text-cyan-400" />
                    {(playlist.play_count || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
