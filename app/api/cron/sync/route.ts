import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getChannels } from '@/lib/api';
import { syncChannelVideos } from '@/lib/youtubeSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing YouTube API Key' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channels = await getChannels();
    let syncCount = 0;

    for (const channel of channels) {
      try {
        const uulfId = channel.id.replace(/^UC/, 'UULF');
        
        // 1. Fetch RSS Feed
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uulfId}`;
        let newVideoIds: string[] = [];
        
        const feedRes = await fetch(rssUrl);
        const feedText = await feedRes.text();
        
        const idMatches = feedText.match(/<yt:videoId>([^<]+)<\/yt:videoId>/g);
        if (idMatches) {
           const rssIds = idMatches.map(str => str.replace(/<\/?yt:videoId>/g, ''));
           const { data: existing } = await (supabase.from('videos') as any).select('id').in('id', rssIds);
           const existingIds = new Set((existing as any[])?.map(v => v.id) || []);
           newVideoIds = rssIds.filter(id => !existingIds.has(id));
        }

        // Logic Fallback: If 15 new videos from RSS, maybe there are more. Use API anchor loop.
        // Otherwise, if newVideoIds length > 0, we could still just call the anchor loop to be safe, 
        // because it will stop at the first known video anyway. 
        // Actually, just calling syncChannelVideos() is perfectly safe and minimal cost if we know there are updates!
        if (newVideoIds.length > 0) {
            const count = await syncChannelVideos(channel.id, apiKey);
            syncCount += count;
        }

        // Update last sync
        await (supabase.from('channels') as any).update({ last_sync_at: new Date().toISOString() }).eq('id', channel.id);
      } catch (err) {
        console.error(`Error syncing channel ${channel.id}`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Synced ${syncCount} new videos across ${channels.length} channels.`
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

