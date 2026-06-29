import { getTrendingPlaylists, getRecentPlaylists } from '@/lib/api';
import PlaylistCarousel from '@/components/PlaylistCarousel';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [trendingPlaylists, recentPlaylists] = await Promise.all([
    getTrendingPlaylists(),
    getRecentPlaylists(),
  ]);

  return (
    <div className="space-y-16 py-6">
      {/* Recent Playlists Carousel */}
      <PlaylistCarousel
        playlists={recentPlaylists}
        title="פלייליסטים חדשים"
        type="recent"
        viewAllHref="/playlists?sort=recent"
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
