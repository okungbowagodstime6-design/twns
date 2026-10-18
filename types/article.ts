export type ArticleMetadata = Record<string, unknown>;

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  original_url: string | null;
  source_name: string | null;
  author: string | null;
  country_code: string | null;
  language_code: string | null;
  category_id?: string | null;
  category: string | null;
  status?: string;
  article_type: string | null;
  published_at: string | null;
  source_published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata: ArticleMetadata | null;
  image_url?: string | null;
  is_preview?: boolean;
};
