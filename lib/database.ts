
/*
  This file contains typed definitions for your Supabase database schema.
  It is generated via Supabase CLI or can be manually created based on your real schema.
  Replace this with actual generated types for full type safety.
  For documentation & generation details see: https://supabase.com/docs/guides/api/typescript
*/

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          original_url: string;
          content: string;
          published_at: string;
          slug: string;
          category: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          original_url: string;
          content: string;
          published_at: string;
          slug: string;
          category?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          original_url?: string;
          content?: string;
          published_at?: string;
          slug?: string;
          category?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: {};
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}




