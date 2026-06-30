import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncSinglePlaylistVideos } from '@/lib/youtubeSync';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { playlistId } = await req.json();

    if (!playlistId) {
      return NextResponse.json({ error: 'חסר מזהה פלייליסט' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'מפתח API של יוטיוב חסר בשרת' }, { status: 500 });
    }

    // Check if playlist exists in our DB
    const { data: playlist } = await (supabase.from('playlists') as any).select('*').eq('id', playlistId).single();
    if (!playlist) {
      return NextResponse.json({ error: 'פלייליסט לא נמצא במסד הנתונים' }, { status: 404 });
    }

    // Check last sync
    const lastSync = playlist.last_sync_at ? new Date(playlist.last_sync_at).getTime() : 0;
    const now = Date.now();
    // Throttle sync to once per hour at most to prevent API abuse
    if (now - lastSync < 3600 * 1000) {
        return NextResponse.json({
          success: true,
          message: 'הפלייליסט סונכרן לאחרונה, אין צורך בסנכרון נוסף כעת.',
          count: 0
        });
    }

    const insertedCount = await syncSinglePlaylistVideos(playlistId, playlist.channel_id, apiKey);

    return NextResponse.json({
      success: true,
      message: `הפלייליסט סונכרן בהצלחה. נוספו ${insertedCount} שירים.`,
      count: insertedCount
    });

  } catch (error: any) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: error.message || 'שגיאה בעת סנכרון הפלייליסט' }, { status: 500 });
  }
}
