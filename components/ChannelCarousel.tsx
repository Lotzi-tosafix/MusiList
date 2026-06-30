'use client';

import { ChannelRow } from '@/lib/api';
import Link from 'next/link';

export default function ChannelCarousel({ channels, title }: { channels: ChannelRow[], title: string }) {
  if (!channels || channels.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {channels.map(channel => (
          <Link key={channel.id} href={`/channel/${channel.id}`} className="group flex flex-col items-center gap-3">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-violet-500 transition-colors shadow-lg">
              {channel.thumbnail ? (
                <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-3xl">{channel.title.charAt(0)}</div>
              )}
            </div>
            <h3 className="text-white font-medium text-center text-sm md:text-base line-clamp-1 group-hover:text-violet-400 transition-colors">{channel.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
