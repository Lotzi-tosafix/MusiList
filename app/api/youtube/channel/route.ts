import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncChannelVideos, syncChannelPlaylists } from '@/lib/youtubeSync';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { channelUrl } = await req.json();

    if (!channelUrl) {
      return NextResponse.json({ error: 'חסר קישור לערוץ' }, { status: 400 });
    }

    let channelId = '';
    const match = channelUrl.match(/channel\/(UC[\w-]+)/);
    if (match) {
      channelId = match[1];
    } else {
       if (channelUrl.startsWith('UC')) {
           channelId = channelUrl;
       } else {
           return NextResponse.json({ error: 'לא הצלחנו לחלץ את מזהה הערוץ. יש לספק קישור בפורמט /channel/UC...' }, { status: 400 });
       }
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'מפתח API של יוטיוב חסר בשרת' }, { status: 500 });
    }

    // 1. Fetch channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'הערוץ לא נמצא' }, { status: 404 });
    }

    const channelSnippet = channelData.items[0].snippet;
    const channelTitle = channelSnippet.title;
    const channelThumbnail = channelSnippet.thumbnails?.high?.url || channelSnippet.thumbnails?.default?.url;

    const { error: channelError } = await (supabase.from('channels') as any).upsert({
        id: channelId,
        title: channelTitle,
        thumbnail: channelThumbnail,
        last_sync_at: new Date().toISOString()
    });

    if (channelError) throw channelError;

    // 2. Fetch all channel playlists
    await syncChannelPlaylists(channelId, apiKey);

    // 3. Anchor-based syncing for UULF videos
    const insertedCount = await syncChannelVideos(channelId, apiKey);

    return NextResponse.json({
      success: true,
      message: `הערוץ ו-${insertedCount} שירים יובאו בהצלחה!`,
      channelId,
    });

  } catch (error: any) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: error.message || 'שגיאה בעת הבאת הנתונים מיוטיוב' }, { status: 500 });
  }
}

