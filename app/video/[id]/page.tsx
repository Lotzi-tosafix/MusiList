import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';

export const dynamic = 'force-dynamic';

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: video, error } = await supabase
    .from('videos')
    .select('*, channel:channels(*)')
    .eq('id', id)
    .single();

  if (error || !video) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from('video_chapters')
    .select('*')
    .eq('video_id', id)
    .order('start_time', { ascending: true });

  const playableVideo = {
    ...(video as any),
    youtube_id: (video as any).id,
    chapters: chapters || []
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
       <VideoPlayer video={playableVideo as any} />
    </div>
  );
}
