import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveCategorySlug } from "./classify";

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  source_name: string | null;
  original_url: string | null;
  country_code: string | null;
  category: string | null;
  category_slug: string | null;
  main_category?: string | null;
  sub_category?: string | null;
  article_type: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type PublishedArticleQuery = {
  limit?: number;
  categorySlug?: string;
  countryCode?: string;
  articleTypes?: string[];
  mainCategory?: string;
  subCategory?: string;
  search?: string;
};

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  source_name: string | null;
  original_url: string | null;
  country_code: string | null;
  article_type: string | null;
  main_category: string | null;
  sub_category: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function mapArticle(row: ArticleRow): PublicArticle {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    source_name: row.source_name,
    original_url: row.original_url,
    country_code: row.country_code,
    category: category?.name ?? null,
    category_slug: category?.slug ?? null,
    main_category: row.main_category,
    sub_category: row.sub_category,
    article_type: row.article_type,
    published_at: row.published_at,
    metadata: row.metadata
  };
}

const articleSelect = "id, slug, title, summary, content, source_name, original_url, country_code, article_type, main_category, sub_category, published_at, metadata, categories(name, slug)";

export async function getPublishedArticles(options: PublishedArticleQuery = {}): Promise<PublicArticle[]> {
  const supabase = publicClient();
  if (!supabase) return [];

  const limit = options.limit ?? 12;
  let query = supabase.from("news_articles").select(articleSelect).eq("status", "PUBLISHED");

  if (options.countryCode) query = query.eq("country_code", options.countryCode);
  if (options.articleTypes?.length) query = query.in("article_type", options.articleTypes);
  if (options.mainCategory) query = query.eq("main_category", options.mainCategory);
  if (options.subCategory) query = query.eq("sub_category", options.subCategory);
  if (options.categorySlug) {
    const slug = resolveCategorySlug(options.categorySlug);
    if (slug === "breaking") {
      query = query.in("article_type", ["BREAKING", "DEVELOPING"]);
    } else {
      const { data: category } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!category) return [];
      query = query.eq("category_id", category.id);
    }
  }
  if (options.search) {
    const term = options.search.replace(/[%_,()]/g, " ").trim();
    if (term) query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }

  const { data, error } = await query.order("published_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  return (data as ArticleRow[]).map(mapArticle);
}

export async function getPublishedArticle(slug: string): Promise<PublicArticle | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("news_articles").select(articleSelect).eq("slug", slug).eq("status", "PUBLISHED").maybeSingle();
  if (error || !data) return null;
  return mapArticle(data as ArticleRow);
}

export async function getPublishedArticlesForSitemap(): Promise<Array<Pick<PublicArticle, "slug" | "published_at">>> {
  const supabase = publicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("news_articles")
    .select("slug, published_at")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) throw error;
  return data ?? [];
}
