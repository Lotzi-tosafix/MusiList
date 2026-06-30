import { searchVideos } from '@/lib/api';
import VideoList from '@/components/VideoList';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const { q } = await searchParams;
  const query = q || '';
  
  if (!query) {
     return (
       <div className="text-center py-20 text-slate-500 text-lg">
         הזן ביטוי חיפוש
       </div>
     )
  }

  const videos = await searchVideos(query);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold font-display text-white">תוצאות חיפוש עבור: &quot;{query}&quot;</h1>
      
      {videos.length > 0 ? (
         <VideoList videos={videos} />
      ) : (
         <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed text-slate-500 text-lg">
           לא נמצאו שירים התואמים לחיפוש.
         </div>
      )}
    </div>
  );
}
