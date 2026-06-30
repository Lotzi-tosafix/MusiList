import { getRecentVideos } from '@/lib/api';
import { getHotSongs, getAllVideos } from '@/lib/plays';
import VideoList from '@/components/VideoList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === 'hot' ? 'hot' : 'new';

  // Fetch both or conditionally fetch
  const songs = activeTab === 'hot' 
    ? await getHotSongs(100) 
    : await getAllVideos();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Title */}
      <div className="text-right">
        <h1 className="text-3xl md:text-4xl font-black font-display text-white tracking-tight mb-2">
          כל השירים באתר
        </h1>
        <p className="text-slate-400 text-sm">
          האזן לכל השירים מכל הערוצים והיוצרים במקום אחד
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-start border-b border-slate-800">
        <div className="flex gap-4">
          <Link
            href="/songs?tab=new"
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'new'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            שירים חדשים
          </Link>
          <Link
            href="/songs?tab=hot"
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'hot'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            שירים חמים (המושמעים ביותר)
          </Link>
        </div>
      </div>

      {/* Video List */}
      <div className="space-y-6">
        {songs.length > 0 ? (
          <VideoList videos={songs} />
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500">
            אין שירים להצגה כרגע.
          </div>
        )}
      </div>
    </div>
  );
}
