import { getPlaylistById } from "@/lib/api";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const playlist = await getPlaylistById(resolvedParams.id);

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          הפלייליסט לא נמצא
        </h1>
        <Link href="/" className="text-violet-600 dark:text-violet-400 hover:underline">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  return <PlaylistPlayer playlist={playlist} />;
}
