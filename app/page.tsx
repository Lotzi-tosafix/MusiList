import {
  getTrendingPlaylists,
  getRecentAlbums,
  getTopArtists,
  getTrendingSongs,
} from "@/lib/api";
import PlaylistCarousel from "@/components/PlaylistCarousel";
import SongCarousel from "@/components/SongCarousel";
import ArtistCarousel from "@/components/ArtistCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [trendingPlaylists, recentAlbums, topArtists, trendingSongs] =
    await Promise.all([
      getTrendingPlaylists(),
      getRecentAlbums(),
      getTopArtists(),
      getTrendingSongs(),
    ]);

  return (
    <div className="space-y-16 py-6">
      {/* Top Artists Carousel */}
      <ArtistCarousel
        artists={topArtists}
        title="אמנים מובילים"
      />

      {/* Recent Albums Carousel */}
      <PlaylistCarousel
        playlists={recentAlbums}
        title="אלבומים חדשים"
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
