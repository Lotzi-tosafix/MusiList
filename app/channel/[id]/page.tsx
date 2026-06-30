import { getChannelById, getChannelVideos, getChannelPlaylists } from '@/lib/api';
import { notFound } from 'next/navigation';
import VideoList from '@/components/VideoList';
import Link from 'next/link';
import { ListMusic, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannelById(id);

  if (!channel) {
    notFound();
  }

  const [videos, playlists] = await Promise.all([
    getChannelVideos(id),
    getChannelPlaylists(id)
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        {/* Background Blur */}
        <div 
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{ 
            backgroundImage: channel.thumbnail ? `url(${channel.thumbnail})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-slate-950 shadow-2xl shrink-0 bg-slate-800">
          {channel.thumbnail ? (
            <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-slate-500 font-bold">{channel.title.charAt(0)}</div>
          )}
        </div>
        
        <div className="relative z-10 text-center md:text-right flex-1">
          <h1 className="text-4xl md:text-5xl font-black font-display text-white mb-4 tracking-tight">
            {channel.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-medium">
            <span className="bg-slate-950/50 px-4 py-2 rounded-full border border-slate-800">
              {videos.length} שירים
            </span>
            <span className="bg-slate-950/50 px-4 py-2 rounded-full border border-slate-800">
              {playlists.length} פלייליסטים
            </span>
            <span className="bg-slate-950/50 px-4 py-2 rounded-full border border-slate-800 text-xs font-mono">
              סנכרון אחרון: {channel.last_sync_at ? new Date(channel.last_sync_at).toLocaleDateString('he-IL') : 'טרם סונכרן'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
         <h2 className="text-2xl font-bold font-display text-white">כל השירים</h2>
         {videos.length > 0 ? (
           <VideoList videos={videos} channel={channel} />
         ) : (
           <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500">
             אין שירים בערוץ זה כרגע.
           </div>
         )}
      </div>
    </div>
  );
}
