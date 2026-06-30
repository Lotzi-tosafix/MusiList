import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { videoId, playlistId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: 'חסר מזהה סרטון/שיר' }, { status: 400 });
    }

    // 1. Ensure system channel exists
    const { data: systemChannel, error: channelErr } = await (supabase.from('channels') as any)
      .select('id')
      .eq('id', '_system')
      .single();

    if (channelErr || !systemChannel) {
      await (supabase.from('channels') as any).upsert({
        id: '_system',
        title: 'System',
        thumbnail: ''
      }, { onConflict: 'id' });
    }

    // 2. Ensure plays_log video exists
    const { data: logVideo, error: logErr } = await (supabase.from('videos') as any)
      .select('*')
      .eq('id', '_plays_log')
      .single();

    let logs: any[] = [];
    if (logErr || !logVideo) {
      // Create empty log
      await (supabase.from('videos') as any).upsert({
        id: '_plays_log',
        channel_id: '_system',
        title: 'Plays Log',
        description: '[]',
        thumbnail: '',
        duration: 0
      }, { onConflict: 'id' });
    } else {
      try {
        logs = JSON.parse(logVideo.description || '[]');
      } catch (e) {
        logs = [];
      }
    }

    // 3. Filter logs from last 7 days
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    logs = logs.filter((item: any) => typeof item === 'object' && item.t && item.t > oneWeekAgo);

    // 4. Add new log entry
    logs.push({
      v: videoId,
      p: playlistId || null,
      t: Date.now()
    });

    // 5. Save back to description
    const { error: updateErr } = await (supabase.from('videos') as any)
      .update({
        description: JSON.stringify(logs)
      })
      .eq('id', '_plays_log');

    if (updateErr) {
      console.error('Failed to update plays log:', updateErr);
      return NextResponse.json({ error: 'שגיאה בעדכון יומן השמעה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Error in plays/track route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
