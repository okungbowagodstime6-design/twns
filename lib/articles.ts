import "server-only";
import { createClient } from "@supabase/supabase-js";

export interface FeedSource {
  id: string | null;
  name: string;
  originalUrl: string | null;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  originalUrl: string | null;
  publishedAt: string | null;
  sources: FeedSource[];
  category: ArticleCategory | null;
}

interface PaginatedArticlesOptions {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
}

interface PaginatedArticlesResult {
  articles: Article[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  original_url: string | null;
  source_name: string | null;
  published_at: string | null;
  categories: ArticleCategory | ArticleCategory[] | null;
  article_sources: Array<{
    source_id: string;
    original_url: string;
    news_sources: { id: string; name: string } | { id: string; name: string }[] | null;
  }> | null;
}

const ARTICLE_SELECT = [
  "id",
  "slug",
  "title",
  "summary",
  "original_url",
  "source_name",
  "published_at",
  "categories(id, name, slug)",
  "article_sources(source_id, original_url, news_sources(id, name))"
].join(", ");

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Public Supabase configuration is missing.");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function mapArticle(row: ArticleRow): Article {
  const category = firstRelation(row.categories);
  const sources: FeedSource[] = (row.article_sources ?? []).flatMap((relation) => {
    const source = firstRelation(relation.news_sources);
    if (!source) return [];

    return [{
      id: source.id,
      name: source.name,
      originalUrl: relation.original_url
    }];
  });

  if (sources.length === 0 && row.source_name) {
    sources.push({ id: null, name: row.source_name, originalUrl: row.original_url });
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    originalUrl: row.original_url ?? sources[0]?.originalUrl ?? null,
    publishedAt: row.published_at,
    sources,
    category
  };
}

export async function getPaginatedArticles({
  page = 1,
  pageSize = 12,
  categorySlug
}: PaginatedArticlesOptions = {}): Promise<PaginatedArticlesResult> {
  const supabase = createPublicClient();
  const currentPageRequest = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const size = Number.isFinite(pageSize) ? Math.min(48, Math.max(1, Math.floor(pageSize))) : 12;

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { articles: [], totalPages: 1, currentPage: 1, totalCount: 0 };
    }
    categoryId = data.id;
  }

  const selectedCategoryId = categoryId;
  const buildQuery = () => {
    let query = supabase
      .from("news_articles")
      .select(ARTICLE_SELECT, { count: "exact" })
      .eq("status", "PUBLISHED");

    if (selectedCategoryId) query = query.eq("category_id", selectedCategoryId);
    return query
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  };

  let { data, error, count } = await buildQuery().range(
    (currentPageRequest - 1) * size,
    currentPageRequest * size - 1
  );
  if (error) throw error;

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / size));
  const currentPage = Math.min(currentPageRequest, totalPages);

  if (currentPage !== currentPageRequest && totalCount > 0) {
    const result = await buildQuery().range((currentPage - 1) * size, currentPage * size - 1);
    if (result.error) throw result.error;
    data = result.data;
  }

  return {
    articles: ((data ?? []) as unknown as ArticleRow[]).map(mapArticle),
    totalPages,
    currentPage,
    totalCount
  };
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ArticleCategory[];
}