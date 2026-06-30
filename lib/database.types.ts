export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string
          title: string
          thumbnail: string | null
          last_sync_at: string | null
        }
        Insert: {
          id: string
          title: string
          thumbnail?: string | null
          last_sync_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          thumbnail?: string | null
          last_sync_at?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          channel_id: string
          title: string
          description: string | null
          thumbnail: string | null
          duration: number | null
          view_count: number | null
          like_count: number | null
          published_at: string | null
        }
        Insert: {
          id: string
          channel_id: string
          title: string
          description?: string | null
          thumbnail?: string | null
          duration?: number | null
          view_count?: number | null
          like_count?: number | null
          published_at?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          description?: string | null
          thumbnail?: string | null
          duration?: number | null
          view_count?: number | null
          like_count?: number | null
          published_at?: string | null
        }
      }
      playlists: {
        Row: {
          id: string
          channel_id: string
          title: string
          last_sync_at: string | null
          thumbnail: string | null
        }
        Insert: {
          id: string
          channel_id: string
          title: string
          last_sync_at?: string | null
          thumbnail?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          last_sync_at?: string | null
          thumbnail?: string | null
        }
      }
      playlist_items: {
        Row: {
          playlist_id: string
          video_id: string
          position: number
        }
        Insert: {
          playlist_id: string
          video_id: string
          position: number
        }
        Update: {
          playlist_id?: string
          video_id?: string
          position?: number
        }
      }
      video_chapters: {
        Row: {
          id: string
          video_id: string
          title: string
          start_time: number
        }
        Insert: {
          id?: string
          video_id: string
          title: string
          start_time: number
        }
        Update: {
          id?: string
          video_id?: string
          title?: string
          start_time?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
