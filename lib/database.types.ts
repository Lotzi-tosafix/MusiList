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
      playlists: {
        Row: {
          id: string
          title: string
          description: string | null
          tags: string[] | null
          is_public: boolean
          play_count: number
          creator_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          tags?: string[] | null
          is_public?: boolean
          play_count?: number
          creator_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          tags?: string[] | null
          is_public?: boolean
          play_count?: number
          creator_id?: string | null
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          playlist_id: string
          youtube_id: string
          title: string
          thumbnail: string | null
          duration: string | null
          likes: number | null
          position: number
          created_at: string
          published_at: string | null
          view_count: number | null
        }
        Insert: {
          id?: string
          playlist_id: string
          youtube_id: string
          title: string
          thumbnail?: string | null
          duration?: string | null
          likes?: number | null
          position?: number
          created_at?: string
          published_at?: string | null
          view_count?: number | null
        }
        Update: {
          id?: string
          playlist_id?: string
          youtube_id?: string
          title?: string
          thumbnail?: string | null
          duration?: string | null
          likes?: number | null
          position?: number
          created_at?: string
          published_at?: string | null
          view_count?: number | null
        }
      }
      playlist_plays: {
        Row: {
          id: string
          playlist_id: string
          played_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          played_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          played_at?: string
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
