import { getHotPlaylists, getAllPlaylists } from '@/lib/plays';
import Link from 'next/link';
import { Music4, CalendarDays, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === 'hot' ? 'hot' : 'new';

  const playlists = activeTab === 'hot'
    ? await getHotPlaylists(100)
    : await getAllPlaylists();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Title */}
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-black font-display text-white tracking-tight mb-2">
          כל הפלייליסטים באתר
        </h1>
        <p className="text-slate-400 text-sm">
          חקור פלייליסטים, אלבומים ואוספי שירים מכל הערוצים והיוצרים
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-start border-b border-slate-800">
        <div className="flex gap-4">
          <Link
            href="/playlists?tab=new"
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'new'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            פלייליסטים חדשים
          </Link>
          <Link
            href="/playlists?tab=hot"
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'hot'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            פלייליסטים חמים
          </Link>
        </div>
      </div>

      {/* Playlists Grid */}
      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group relative bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4 hover:bg-slate-900/80 hover:border-violet-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/20 flex flex-col justify-between"
            >
              <div>
                {/* Playlist Art Cover */}
                <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800/60 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-indigo-500/5 to-cyan-400/5 group-hover:opacity-80 transition-opacity" />
                  
                  <Music4 className="w-16 h-16 text-slate-700 group-hover:text-violet-500/60 transition-colors duration-300" />
                  
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800/50 text-[10px] font-mono text-slate-400 font-bold">
                    פלייליסט
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-violet-300 transition-colors mb-1 text-right" title={playlist.title}>
                  {playlist.title}
                </h3>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/50">
                <p className="text-slate-400 text-xs line-clamp-1 text-right font-medium">
                  {playlist.channel?.title}
                </p>
                {playlist.last_sync_at && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end mt-1">
                    <CalendarDays className="w-3 h-3 text-slate-600" />
                    סונכרן: {new Date(playlist.last_sync_at).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500">
          אין פלייליסטים להצגה כרגע.
        </div>
      )}
    </div>
  );
}
