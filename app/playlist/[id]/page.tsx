import { getPlaylistById, getPlaylistItems, getChannelById } from '@/lib/api';
import { notFound } from 'next/navigation';
import VideoList from '@/components/VideoList';
import Link from 'next/link';
import PlaylistSyncManager from '@/components/PlaylistSyncManager';

export const dynamic = 'force-dynamic';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const playlist = await getPlaylistById(id);

  if (!playlist) {
    notFound();
  }

  const channel = await getChannelById(playlist.channel_id);
  const videos = await getPlaylistItems(id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 relative">
      <PlaylistSyncManager playlistId={playlist.id} lastSyncAt={playlist.last_sync_at} />
      
      {/* Header */}
      <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-slate-950 shadow-2xl shrink-0 bg-slate-800 flex items-center justify-center">
            {playlist.thumbnail ? (
              <img src={playlist.thumbnail} alt={playlist.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-slate-500 font-bold">{playlist.title.charAt(0)}</span>
            )}
        </div>
        
        <div className="relative z-10 text-center md:text-right flex-1">
          <h1 className="text-3xl md:text-4xl font-black font-display text-white mb-4 tracking-tight">
            {playlist.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-medium">
            <span className="bg-slate-950/50 px-4 py-2 rounded-full border border-slate-800">
              {videos.length} שירים
            </span>
            {channel && (
               <Link href={`/channel/${channel.id}`} className="hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">
                 לערוץ: {channel.title}
               </Link>
            )}
            <span className="bg-slate-950/50 px-4 py-2 rounded-full border border-slate-800 text-xs font-mono">
              סנכרון אחרון: {playlist.last_sync_at ? new Date(playlist.last_sync_at).toLocaleDateString('he-IL') : 'לא סונכרן'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
         <h2 className="text-2xl font-bold font-display text-white">שירי הפלייליסט</h2>
         {videos.length > 0 ? (
           <VideoList videos={videos} channel={channel || undefined} playlistId={playlist.id} />
         ) : (
           <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500">
             אין שירים בפלייליסט זה כרגע.
           </div>
         )}
      </div>
    </div>
  );
}
