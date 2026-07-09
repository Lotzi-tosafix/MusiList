import Link from "next/link";
import Image from "next/image";
import { ArtistRow } from "@/lib/api";

interface ArtistCarouselProps {
  artists: ArtistRow[];
  title: string;
}

export default function ArtistCarousel({ artists, title }: ArtistCarouselProps) {
  if (!artists || artists.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            href={`/artist/${artist.id}`}
            className="group flex-shrink-0 w-32 md:w-40 flex flex-col items-center gap-2"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-muted">
              {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={artist.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                  {artist.name[0]}
                </div>
              )}
            </div>
            <h3 className="font-medium text-center line-clamp-1 group-hover:text-primary transition-colors">
              {artist.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
