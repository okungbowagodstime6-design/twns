import type { SupabaseClient } from "@supabase/supabase-js";
import { policyFlags } from "@/lib/editorial/policy";
import { inferArticleType, inferCategorySlug, inferCountryCode } from "@/lib/news/classify";

export type IngestionSource = {
  id: string;
  name: string;
  category_id?: string | null;
  country_code?: string | null;
};

export type IngestionItem = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  canonical_url: string;
  source_published_at: string | null;
  language_code: string | null;
  country_code: string | null;
};

function articleSlug(title: string, id: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${slug || "article"}-${id.slice(0, 8)}`;
}

async function resolveCategoryId(supabase: SupabaseClient, source: IngestionSource, item: IngestionItem): Promise<string | null> {
  if (source.category_id) return source.category_id;
  const slug = inferCategorySlug(item.title, item.description, source.name);
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

export async function createReviewArticleFromItem(
  supabase: SupabaseClient,
  source: IngestionSource,
  item: IngestionItem,
  processingNote: string
): Promise<{ articleId: string }> {
  const categoryId = await resolveCategoryId(supabase, source, item);
  const countryCode = inferCountryCode(source.country_code ?? item.country_code, item.title, item.description);
  const { data: article, error: articleError } = await supabase.from("news_articles").insert({
    slug: articleSlug(item.title, item.id),
    title: item.title,
    summary: item.description,
    original_url: item.canonical_url,
    source_name: source.name,
    author: item.author,
    country_code: countryCode,
    language_code: item.language_code,
    category_id: categoryId,
    status: "REVIEW",
    article_type: inferArticleType(item.title, item.description),
    source_published_at: item.source_published_at,
    metadata: { attribution: `Source: ${source.name}`, processing: processingNote }
  }).select("id").single();
  if (articleError || !article) throw articleError ?? new Error("Unable to create article.");

  const { error: sourceLinkError } = await supabase.from("article_sources").insert({
    article_id: article.id,
    source_id: source.id,
    original_url: item.canonical_url
  });
  if (sourceLinkError) throw sourceLinkError;

  const flags = policyFlags(item.title, item.description);
  if (flags.length) {
    const { error: flagError } = await supabase.from("editorial_flags").insert(
      flags.map((flag) => ({ article_id: article.id, flag_type: flag.flagType, severity: flag.severity, reason: flag.reason }))
    );
    if (flagError) throw flagError;
  }

  const { error: itemUpdateError } = await supabase.from("source_items").update({
    article_id: article.id,
    processing_status: "REVIEW"
  }).eq("id", item.id);
  if (itemUpdateError) throw itemUpdateError;

  return { articleId: article.id };
}
