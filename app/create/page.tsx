"use client";

import { useState, useEffect } from "react";
import {
  Youtube,
  Search,
  Plus,
  X,
  Loader2,
  AlertCircle,
  GripVertical,
  Lock,
  Globe,
  ArrowDownAZ,
  CalendarDays,
  ArrowUpAZ,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
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
          src={video.thumbnail}
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

export default function CreatePlaylist() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [popularTags, setPopularTags] =
    useState<string[]>(INITIAL_POPULAR_TAGS);
  const [error, setError] = useState("");
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [alphaSortDir, setAlphaSortDir] = useState<"asc" | "desc" | null>(null);
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc" | null>(null);
  const [viewsSortDir, setViewsSortDir] = useState<"asc" | "desc" | null>(null);
  const [likesSortDir, setLikesSortDir] = useState<"asc" | "desc" | null>(null);
  const [originalVideos, setOriginalVideos] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
  }, []);

  const suggestedTags = popularTags.filter(
    (t) => t.includes(tagInput) && !tags.includes(t),
  );

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_playlist", url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "שגיאה בייבוא הפלייליסט");
      }

      setPlaylistData(data);
      setPlaylistTitle(data.title);
      setPlaylistDescription(data.description || "");
      setVideos(data.videos);
      setOriginalVideos([...data.videos]);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;

    // Split by comma in case user pastes comma separated list
    const newTags = tag
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    const uniqueNewTags = newTags.filter((t) => !tags.includes(t));

    if (uniqueNewTags.length > 0) {
      setTags([...tags, ...uniqueNewTags]);

      // Add any new tags to popular tags so they appear in suggestions
      const newPopular = uniqueNewTags.filter((t) => !popularTags.includes(t));
      if (newPopular.length > 0) {
        setPopularTags([...popularTags, ...newPopular]);
      }
    }
    setTagInput("");
  };

  const handleNextStep = () => {
    if (step === 2) {
      setStep(3);
    }
  };

  const handleSave = async () => {
    if (!playlistData || !playlistTitle) return;
    setLoading(true);
    setError("");

    try {
      // 1. Insert Playlist
      const firstVideoThumb = videos[0]?.thumbnail || null;
      const { data: newPlaylist, error: playlistError } = await (supabase as any)
        .from("playlists")
        .insert([
          {
            youtube_id: playlistData.youtube_id || null,
            title: playlistTitle,
            description: playlistDescription,
            thumbnail_url: firstVideoThumb,
            tags,
            is_public: isPublic,
            play_count: 0,
            creator_id: user?.id || null,
          },
        ])
        .select()
        .single();

      if (playlistError)
        throw new Error("שגיאה בשמירת הפלייליסט: " + playlistError.message);

      // 2. Prepare and Upsert Songs (to ensure they exist in the `songs` table)
      const songsToUpsert = videos.map((v: any) => ({
        youtube_id: v.youtube_id,
        title: v.title,
        thumbnail_url: v.thumbnail || null,
        duration: v.duration || 0,
        published_at: v.published_at || v.publishedAt || new Date().toISOString(),
      }));

      const { data: upsertedSongs, error: songsError } = await (supabase as any)
        .from("songs")
        .upsert(songsToUpsert, { onConflict: "youtube_id" })
        .select();

      if (songsError)
        throw new Error("שגיאה בשמירת השירים במסד הנתונים: " + songsError.message);

      // 3. Create a map from youtube_id to song UUID
      const songIdMap = new Map<string, string>();
      (upsertedSongs || []).forEach((s: any) => {
        songIdMap.set(s.youtube_id, s.id);
      });

      // 4. Construct playlist_songs records and link them
      const playlistSongsToInsert = videos.map((v: any, index: number) => {
        const songId = songIdMap.get(v.youtube_id);
        if (!songId) {
          throw new Error(`שגיאה במיפוי שיר: ${v.title}`);
        }
        return {
          playlist_id: newPlaylist.id,
          song_id: songId,
          position: index + 1,
        };
      });

      const { error: playlistSongsError } = await (supabase as any)
        .from("playlist_songs")
        .insert(playlistSongsToInsert);

      if (playlistSongsError)
        throw new Error("שגיאה בקישור השירים לפלייליסט: " + playlistSongsError.message);

      // 5. Redirect to the new playlist
      router.push(`/playlist/${newPlaylist.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900/60 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Youtube className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ייבוא פלייליסט</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          כדי לייבא ולערוך פלייליסטים, אנא התחבר לחשבונך.
        </p>

        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin + "/create" },
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
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="ביטול ויציאה"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {step === 1 ? "ייבוא פלייליסט" : "הגדרות פלייליסט"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {step === 1
            ? "הכנס קישור לפלייליסט מיוטיוב כדי להתחיל"
            : "הוסף תגיות ותיאור כדי שאחרים יוכלו למצוא אותו"}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleImport} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-red-500">
                <Youtube className="w-6 h-6" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full pl-4 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-left dir-ltr shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>משוך סרטונים</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                שם הפלייליסט (יובא אוטומטית)
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 outline-none shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                תגיות (ליצירה והפרדה בין תגיות לחצו ENTER)
              </label>
              <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-violet-500 bg-slate-50 dark:bg-slate-900 shadow-inner">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-medium"
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
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag(tagInput))
                  }
                  placeholder="הוסף תגית (למשל: שבת, קצבי)..."
                  className="w-full outline-none p-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              {tagInput && suggestedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-full mb-1">
                    הצעות מתאימות:
                  </span>
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="flex items-center gap-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {tag}
                    </button>
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
                onClick={() => setStep(1)}
                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                חזור
              </button>
              <button
                onClick={handleNextStep}
                className="flex-2 w-2/3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                הבא
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
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
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${alphaSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
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
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${dateSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
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
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${viewsSortDir ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300" : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
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
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors border ${likesSortDir ? "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300" : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
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
                onClick={() => setStep(2)}
                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                חזור
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-2 w-2/3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                {loading ? (
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
