import { getRecentVideos } from '@/lib/api';
import { getHotSongs, getHotPlaylists, getAllPlaylists } from '@/lib/plays';
import VideoCarousel from '@/components/VideoCarousel';
import PlaylistCarousel from '@/components/PlaylistCarousel';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Parallel fetch of all sliders' data
  const [
    recentVideos,
    hotVideos,
    allPlaylists,
    hotPlaylists,
  ] = await Promise.all([
    getRecentVideos(10),
    getHotSongs(10),
    getAllPlaylists(),
    getHotPlaylists(10),
  ]);

  // For "New Playlists", take the first 10
  const recentPlaylists = allPlaylists.slice(0, 10);

  return (
    <div className="space-y-16 py-6">
      {/* New Songs Slider */}
      <VideoCarousel
        videos={recentVideos}
        title="שירים חדשים"
        viewAllLink="/songs?tab=new"
      />

      {/* Hot Songs Slider */}
      <VideoCarousel
        videos={hotVideos}
        title="שירים חמים באתר"
        viewAllLink="/songs?tab=hot"
      />

      {/* New Playlists Slider */}
      <PlaylistCarousel
        playlists={recentPlaylists}
        title="פלייליסטים חדשים"
        viewAllLink="/playlists?tab=new"
      />

      {/* Hot Playlists Slider */}
      <PlaylistCarousel
        playlists={hotPlaylists}
        title="פלייליסטים חמים באתר"
        viewAllLink="/playlists?tab=hot"
      />
    </div>
  );
}
