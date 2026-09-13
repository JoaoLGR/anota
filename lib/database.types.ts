export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; name: string | null; created_at: string; updated_at: string }; Insert: { id: string; name?: string | null }; Update: { name?: string | null }; Relationships: [] };
      folders: { Row: { id: string; user_id: string; name: string; icon: string; color: string; position: number; created_at: string; updated_at: string }; Insert: { user_id: string; name: string; icon?: string; color?: string; position?: number }; Update: { name?: string; icon?: string; color?: string; position?: number }; Relationships: [] };
      notes: { Row: { id: string; user_id: string; folder_id: string | null; title: string; color: string | null; content: Json; content_text: string; is_favorite: boolean; is_pinned: boolean; is_archived: boolean; deleted_at: string | null; created_at: string; updated_at: string }; Insert: { user_id: string; folder_id?: string | null; title?: string; color?: string | null; content?: Json; content_text?: string; is_favorite?: boolean; is_pinned?: boolean; is_archived?: boolean; deleted_at?: string | null }; Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
