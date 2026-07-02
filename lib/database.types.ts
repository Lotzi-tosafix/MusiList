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
      channels: {
        Row: {
          id: string;
          youtube_id: string;
          title: string;
          created_at: string;
          songs_last_updated: string;
          playlists_last_updated: string;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          title: string;
          created_at?: string;
          songs_last_updated?: string;
          playlists_last_updated?: string;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          title?: string;
          created_at?: string;
          songs_last_updated?: string;
          playlists_last_updated?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          youtube_id: string;
          title: string;
          thumbnail_url: string | null;
          duration: number;
          channel_id: string | null;
          published_at: string;
          created_at: string;
          play_count: number;
          likes_count: number;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          title: string;
          thumbnail_url?: string | null;
          duration?: number;
          channel_id?: string | null;
          published_at?: string;
          created_at?: string;
          play_count?: number;
          likes_count?: number;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          title?: string;
          thumbnail_url?: string | null;
          duration?: number;
          channel_id?: string | null;
          published_at?: string;
          created_at?: string;
          play_count?: number;
          likes_count?: number;
        };
      };
      playlists: {
        Row: {
          id: string;
          youtube_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          channel_id: string | null;
          created_at: string;
          last_updated_at: string;
          play_count: number;
          likes_count: number;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          channel_id?: string | null;
          created_at?: string;
          last_updated_at?: string;
          play_count?: number;
          likes_count?: number;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          channel_id?: string | null;
          created_at?: string;
          last_updated_at?: string;
          play_count?: number;
          likes_count?: number;
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
