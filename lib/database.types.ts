export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          youtube_id: string;
          name: string;
          avatar_url: string | null;
          banner_url: string | null;
          description: string | null;
          created_at: string;
          last_updated: string | null;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          name: string;
          avatar_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          created_at?: string;
          last_updated?: string | null;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          name?: string;
          avatar_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          created_at?: string;
          last_updated?: string | null;
        };
      };
      songs: {
        Row: {
          id: string;
          youtube_id: string;
          alternate_video_id?: string | null;
          title: string;
          thumbnail_url: string | null;
          duration: number;
          artist_id: string | null;
          album_id: string | null;
          published_at: string;
          created_at: string;
          play_count: number;
          likes_count: number;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          alternate_video_id?: string | null;
          title: string;
          thumbnail_url?: string | null;
          duration?: number;
          artist_id?: string | null;
          album_id?: string | null;
          published_at?: string;
          created_at?: string;
          play_count?: number;
          likes_count?: number;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          alternate_video_id?: string | null;
          title?: string;
          thumbnail_url?: string | null;
          duration?: number;
          artist_id?: string | null;
          album_id?: string | null;
          published_at?: string;
          created_at?: string;
          play_count?: number;
          likes_count?: number;
        };
      };
      playlists: {
        Row: {
          id: string;
          youtube_id: string | null;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          artist_id: string | null;
          type: string | null;
          release_year: number | null;
          created_at: string;
          last_updated_at: string;
          play_count: number;
          likes_count: number;
          tags: string[] | null;
          is_public: boolean | null;
          creator_id: string | null;
        };
        Insert: {
          id?: string;
          youtube_id?: string | null;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          artist_id?: string | null;
          type?: string | null;
          release_year?: number | null;
          created_at?: string;
          last_updated_at?: string;
          play_count?: number;
          likes_count?: number;
          tags?: string[] | null;
          is_public?: boolean | null;
          creator_id?: string | null;
        };
        Update: {
          id?: string;
          youtube_id?: string | null;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          artist_id?: string | null;
          type?: string | null;
          release_year?: number | null;
          created_at?: string;
          last_updated_at?: string;
          play_count?: number;
          likes_count?: number;
          tags?: string[] | null;
          is_public?: boolean | null;
          creator_id?: string | null;
        };
      };
      playlist_songs: {
        Row: {
          id: string;
          playlist_id: string;
          song_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          song_id: string;
          position: number;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          song_id?: string;
          position?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
