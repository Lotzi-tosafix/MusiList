import {
  getTrendingPlaylists,
  getRecentPlaylists,
  getTrendingSongs,
  getRecentSongs,
} from "@/lib/api";
import PlaylistCarousel from "@/components/PlaylistCarousel";
import SongCarousel from "@/components/SongCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [trendingPlaylists, recentPlaylists, trendingSongs, recentSongs] =
    await Promise.all([
      getTrendingPlaylists(),
      getRecentPlaylists(),
      getTrendingSongs(),
      getRecentSongs(),
    ]);

  return (
    <div className="space-y-16 py-6">
      {/* New Songs Carousel */}
      <SongCarousel
        songs={recentSongs}
        title="שירים חדשים"
        type="recent"
        viewAllHref="/songs?sort=recent"
      />

      {/* Recent Playlists Carousel */}
      <PlaylistCarousel
        playlists={recentPlaylists}
        title="פלייליסטים חדשים"
        type="recent"
        viewAllHref="/playlists?sort=recent"
      />

      {/* Hot Songs Carousel */}
      <SongCarousel
        songs={trendingSongs}
        title="שירים חמים"
        type="trending"
        viewAllHref="/songs?sort=trending"
      />

      {/* Hot Playlists Carousel */}
      <PlaylistCarousel
        playlists={trendingPlaylists}
        title="פלייליסטים חמים"
        type="trending"
        viewAllHref="/playlists?sort=trending"
      />
    </div>
  );
}
