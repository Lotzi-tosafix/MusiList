"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  Loader2,
  AlertCircle,
  GripVertical,
  Lock,
  Globe,
  ArrowDownAZ,
  CalendarDays,
  X,
  Plus,
  ArrowUpAZ,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  Heart,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { use } from "react";

const INITIAL_POPULAR_TAGS = [
  "שבת",
  "חג",
  "שקט",
  "דאנס",
  "אברהם פריד",
  "חנן בן ארי",
  "ישי ריבו",
  "קצבי",
  "רגש",
  "ווקאלי",
  "למידה",
];

function SortableVideoItem({ video, index }: { video: any; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: video.youtube_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-500"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <span className="text-slate-500 dark:text-slate-400 text-sm font-mono">{index + 1}</span>
      <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-900 flex-shrink-0">
        <img
          src={
            video.thumbnail || "https://picsum.photos/seed/placeholder/640/360"
          }
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{video.title}</p>
      </div>
    </div>
  );
}

export default function EditPlaylist({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [popularTags, setPopularTags] =
    useState<string[]>(INITIAL_POPULAR_TAGS);
  const [isPublic, setIsPublic] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [alphaSortDir, setAlphaSortDir] = useState<"asc" | "desc" | null>(null);
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc" | null>(null);
  const [viewsSortDir, setViewsSortDir] = useState<"asc" | "desc" | null>(null);
  const [likesSortDir, setLikesSortDir] = useState<"asc" | "desc" | null>(null);
  const [originalVideos, setOriginalVideos] = useState<any[]>([]);

  const [step, setStep] = useState(1);

  const fetchPlaylist = async () => {
    setLoading(true);
    setAuthLoading(false);

    try {
      const { data: rawData, error: fetchError } = await (supabase as any)
        .from("playlists")
        .select(`
          *,
          playlist_songs (
            position,
            songs (*)
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      const data: any = rawData;

      const sessionData = await supabase.auth.getSession();
      const currentUser = sessionData.data.session?.user;

      if (
        !currentUser ||
        (currentUser.id !== data.creator_id &&
          currentUser.email?.toLowerCase() !== "y0527148273@gmail.com")
      ) {
        throw new Error("אין לך הרשאות לערוך פלייליסט זה.");
      }

      setPlaylistTitle(data.title);
      setPlaylistDescription(data.description || "");
      setTags(data.tags || []);
      setIsPublic(data.is_public);

      // Map and Sort songs by position
      const mappedVideos = (data.playlist_songs || [])
        .map((ps: any) => ({
          youtube_id: ps.songs.youtube_id,
          title: ps.songs.title,
          thumbnail: ps.songs.thumbnail_url,
          thumbnail_url: ps.songs.thumbnail_url,
          position: ps.position,
          published_at: ps.songs.published_at,
          play_count: ps.songs.play_count,
        }))
        .sort((a: any, b: any) => a.position - b.position);

      setVideos(mappedVideos);
      setOriginalVideos([...mappedVideos]);

      // Update popular tags with any existing tags
      const newPopular = (data.tags || []).filter(
        (t: string) => !INITIAL_POPULAR_TAGS.includes(t),
      );
      if (newPopular.length > 0) {
        setPopularTags([...INITIAL_POPULAR_TAGS, ...newPopular]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaylist();
      } else {
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && loading && authLoading) {
        fetchPlaylist();
      }
    });

    // Fetch existing public tags
    const fetchAllUserTags = async () => {
      try {
        const { data, error } = await supabase
          .from("playlists")
          .select("tags")
          .eq("is_public", true);

        if (data && !error) {
          const allTags = new Set(INITIAL_POPULAR_TAGS);
          data.forEach((item: any) => {
            if (Array.isArray(item.tags)) {
              item.tags.forEach((t: string) => {
                if (t && typeof t === "string" && t.trim()) {
                  allTags.add(t.trim());
                }
              });
            }
          });
          setPopularTags(Array.from(allTags));
        }
      } catch (err) {
        console.error("Error fetching existing tags:", err);
      }
    };
    fetchAllUserTags();

    return () => subscription.unsubscribe();
  }, [id]);

  const suggestedTags = popularTags.filter(
    (t) => t.includes(tagInput) && !tags.includes(t),
  );

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const newTags = tag
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const uniqueNewTags = newTags.filter((t) => !tags.includes(t));

    if (uniqueNewTags.length > 0) {
      setTags([...tags, ...uniqueNewTags]);
      const newPopular = uniqueNewTags.filter((t) => !popularTags.includes(t));
      if (newPopular.length > 0) {
        setPopularTags([...popularTags, ...newPopular]);
      }
    }
    setTagInput("");
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!playlistTitle) return;
    setSaving(true);
    setError("");

    try {
      // 1. Update Playlist details
      const firstVideoThumb = videos[0]?.thumbnail || videos[0]?.thumbnail_url || null;
      const { error: playlistError } = await (supabase as any)
        .from("playlists")
        .update({
          title: playlistTitle,
          description: playlistDescription,
          thumbnail_url: firstVideoThumb,
          tags,
          is_public: isPublic,
        })
        .eq("id", id);

      if (playlistError)
        throw new Error("שגיאה בשמירת הפלייליסט: " + playlistError.message);

      // 2. Delete all existing relations for this playlist in `playlist_songs`
      const { error: deleteSongsError } = await (supabase as any)
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", id);

      if (deleteSongsError)
        throw new Error(
          "שגיאה במחיקת שירים קודמים: " + deleteSongsError.message,
        );

      // 3. Prepare and Upsert Songs (to ensure they exist in the `songs` table)
      const songsToUpsert = videos.map((v: any) => ({
        youtube_id: v.youtube_id,
        title: v.title,
        thumbnail_url: v.thumbnail || v.thumbnail_url || null,
        duration: v.duration || 0,
        published_at: v.published_at || v.publishedAt || new Date().toISOString(),
      }));

      const { data: upsertedSongs, error: songsError } = await (supabase as any)
        .from("songs")
        .upsert(songsToUpsert, { onConflict: "youtube_id" })
        .select();

      if (songsError)
        throw new Error("שגיאה בשמירת השירים במסד הנתונים: " + songsError.message);

      // 4. Create a map from youtube_id to song UUID
      const songIdMap = new Map<string, string>();
      (upsertedSongs || []).forEach((s: any) => {
        songIdMap.set(s.youtube_id, s.id);
      });

      // 5. Construct playlist_songs records and link them
      const playlistSongsToInsert = videos.map((v: any, index: number) => {
        const songId = songIdMap.get(v.youtube_id);
        if (!songId) {
          throw new Error(`שגיאה במיפוי שיר: ${v.title}`);
        }
        return {
          playlist_id: id,
          song_id: songId,
          position: index + 1,
        };
      });

      const { error: playlistSongsError } = await (supabase as any)
        .from("playlist_songs")
        .insert(playlistSongsToInsert);

      if (playlistSongsError)
        throw new Error("שגיאה בקישור השירים לפלייליסט: " + playlistSongsError.message);

      router.push(`/playlist/${id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const resetOrder = () => {
    if (confirm("האם לחזור לסדר המקורי?")) {
      setVideos([...originalVideos]);
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);
      setLikesSortDir(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setVideos((items) => {
        const oldIndex = items.findIndex(
          (item) => item.youtube_id === active.id,
        );
        const newIndex = items.findIndex(
          (item) => item.youtube_id === over?.id,
        );

        return arrayMove(items, oldIndex, newIndex);
      });
      setAlphaSortDir(null);
      setDateSortDir(null);
      setViewsSortDir(null);
      setLikesSortDir(null);
    }
  };

  const toggleAlphaSort = () => {
    const newDir = alphaSortDir === "asc" ? "desc" : "asc";
    const sorted = [...videos].sort((a, b) => {
      return newDir === "asc"
        ? a.title.localeCompare(b.title, "he")
        : b.title.localeCompare(a.title, "he");
    });
    setVideos(sorted);
    setAlphaSortDir(newDir);
    setDateSortDir(null);
    setViewsSortDir(null);
    setLikesSortDir(null);
  };

  const toggleDateSort = () => {
    const newDir = dateSortDir === "asc" ? "desc" : "asc";
    const sorted = [...videos].sort((a, b) => {
      const timeA = a.published_at
        ? new Date(a.published_at).getTime()
        : a.publishedAt
          ? new Date(a.publishedAt).getTime()
          : 0;
      const timeB = b.published_at
        ? new Date(b.published_at).getTime()
        : b.publishedAt
          ? new Date(b.publishedAt).getTime()
          : 0;
      return newDir === "asc" ? timeA - timeB : timeB - timeA;
    });
    setVideos(sorted);
    setDateSortDir(newDir);
    setAlphaSortDir(null);
    setViewsSortDir(null);
    setLikesSortDir(null);
  };

  const toggleViewsSort = () => {
    const newDir = viewsSortDir === "asc" ? "desc" : "asc";
    const sorted = [...videos].sort((a, b) => {
      const viewsA = a.view_count ?? a.viewCount ?? 0;
      const viewsB = b.view_count ?? b.viewCount ?? 0;
      return newDir === "asc" ? viewsA - viewsB : viewsB - viewsA;
    });
    setVideos(sorted);
    setViewsSortDir(newDir);
    setDateSortDir(null);
    setAlphaSortDir(null);
    setLikesSortDir(null);
  };

  const toggleLikesSort = () => {
    const newDir = likesSortDir === "asc" ? "desc" : "asc";
    const sorted = [...videos].sort((a, b) => {
      const likesA = a.like_count ?? a.likes_count ?? a.likeCount ?? a.likesCount ?? 0;
      const likesB = b.like_count ?? b.likes_count ?? b.likeCount ?? b.likesCount ?? 0;
      return newDir === "asc" ? likesA - likesB : likesB - likesA;
    });
    setVideos(sorted);
    setLikesSortDir(newDir);
    setDateSortDir(null);
    setAlphaSortDir(null);
    setViewsSortDir(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900/60 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">עריכת פלייליסט</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          כדי לערוך פלייליסטים, אנא התחבר לחשבונך.
        </p>
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.href },
            })
          }
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/24/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          התחבר עם גוגל
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white dark:bg-slate-900/60 p-8 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={() => router.push(`/playlist/${id}`)}
          className="absolute top-6 left-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="ביטול ויציאה"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}
          >
            1
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}
          >
            2
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                שם הפלייליסט
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                placeholder="לדוגמה: שירי שבת רגועים..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                תיאור (אופציונלי)
              </label>
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all h-24 resize-none"
                placeholder="ספר קצת על הפלייליסט..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                תגיות (ליצירה והפרדה בין תגיות לחצו ENTER)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag(tagInput))
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                  placeholder="הוסף תגית..."
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {tagInput && suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-lg text-sm border border-violet-200 dark:border-violet-500/30"
                    >
                      {tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                הגדרות פרטיות
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isPublic ? "bg-violet-100 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <Globe className="w-5 h-5" />
                  ציבורי
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${!isPublic ? "bg-violet-100 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <Lock className="w-5 h-5" />
                  פרטי
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={handleNextStep}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                הבא
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                סידור וסינון סרטונים ({videos.length})
              </h2>
              <div className="flex gap-2">
                {(alphaSortDir ||
                  dateSortDir ||
                  viewsSortDir ||
                  likesSortDir ||
                  videos.some(
                    (v, i) => v.youtube_id !== originalVideos[i]?.youtube_id,
                  )) && (
                  <button
                    onClick={resetOrder}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors border border-red-200 dark:border-red-500/30"
                    title="אפס סדר"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleAlphaSort}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${alphaSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                >
                  {alphaSortDir === "desc" ? (
                    <ArrowUpAZ className="w-4 h-4" />
                  ) : (
                    <ArrowDownAZ className="w-4 h-4" />
                  )}
                  א-ב
                </button>
                <button
                  onClick={toggleDateSort}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${dateSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                >
                  <CalendarDays className="w-4 h-4" /> תאריך
                  {dateSortDir === "asc" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={toggleViewsSort}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${viewsSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                >
                  <Eye className="w-4 h-4" /> צפיות
                  {viewsSortDir === "asc" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={toggleLikesSort}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${likesSortDir ? "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> לייקים
                  {likesSortDir === "asc" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              גרור סרטונים כדי לשנות את סדר ההשמעה שלהם בפלייליסט.
            </p>

            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={videos.map((v) => v.youtube_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {videos.map((video, index) => (
                    <SortableVideoItem
                      key={video.youtube_id}
                      video={video}
                      index={index}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                חזור
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-2 w-2/3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "שמור פלייליסט"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
