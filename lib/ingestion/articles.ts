import type { SupabaseClient } from "@supabase/supabase-js";
import { policyFlags } from "@/lib/editorial/policy";
import { inferArticleType, inferCategorySlug, inferCountryCode } from "@/lib/news/classify";
import { clusterSourceItem, type ClusterMatchResult } from "@/lib/clustering/cluster";
import { synthesizeJournalisticReport } from "@/lib/editorial/synthesize";

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
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${slug || "article"}-${id.slice(0, 8)}`;
}

async function resolveCategoryId(
  supabase: SupabaseClient,
  source: IngestionSource,
  item: IngestionItem
): Promise<{ categoryId: string | null; categorySlug: string }> {
  if (source.category_id) {
    const { data } = await supabase.from("categories").select("id, slug").eq("id", source.category_id).maybeSingle();
    return { categoryId: source.category_id, categorySlug: data?.slug ?? "world" };
  }
  const slug = inferCategorySlug(item.title, item.description, source.name);
  const { data } = await supabase.from("categories").select("id, slug").eq("slug", slug).maybeSingle();
  return { categoryId: data?.id ?? null, categorySlug: slug };
}

/**
 * Update an existing article when new reporting arrives for the same story cluster.
 * Creates an immutable snapshot in article_revisions and updates developing status.
 */
async function appendDevelopingUpdateToArticle(
  supabase: SupabaseClient,
  articleId: string,
  source: IngestionSource,
  item: IngestionItem,
  clusterResult: ClusterMatchResult
): Promise<{ articleId: string; clusterId: string }> {
  // 1. Fetch current article
  const { data: article, error: fetchErr } = await supabase
    .from("news_articles")
    .select("id, title, summary, content, metadata")
    .eq("id", articleId)
    .single();

  if (fetchErr || !article) throw fetchErr ?? new Error("Existing article not found for update");

  // 2. Fetch highest version number from article_revisions
  const { data: latestRev } = await supabase
    .from("article_revisions")
    .select("version")
    .eq("article_id", articleId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestRev?.version ?? 1) + 1;

  // 3. Format Developing Update Block
  const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  const updateDispatch = item.description || item.title;
  const updateBlock = `\n\n**DEVELOPING UPDATE (${timestamp}):** Reporting confirmed via ${source.name} indicates: ${updateDispatch}`;
  const updatedContent = `${article.content}${updateBlock}`;

  // 4. Update news_articles
  const currentMeta = (article.metadata as Record<string, unknown>) ?? {};
  await supabase
    .from("news_articles")
    .update({
      content: updatedContent,
      article_type: "DEVELOPING",
      updated_at: new Date().toISOString(),
      metadata: {
        ...currentMeta,
        last_updated_by: source.name,
        verified_sources_count: clusterResult.itemCount
      }
    })
    .eq("id", articleId);

  // 5. Record New Revision Snapshot
  await supabase.from("article_revisions").insert({
    article_id: articleId,
    version: nextVersion,
    title: article.title,
    summary: article.summary,
    content: updatedContent,
    change_reason: `Developing update: Ingested cross-corroboration from ${source.name}`
  });

  // 6. Link new source in article_sources
  await supabase.from("article_sources").upsert({
    article_id: articleId,
    source_id: source.id,
    original_url: item.canonical_url
  }, { onConflict: "article_id,source_id" });

  // 7. Update source_item processing status
  await supabase
    .from("source_items")
    .update({
      article_id: articleId,
      processing_status: "PROCESSED"
    })
    .eq("id", item.id);

  // 8. Link cluster item to this article
  await supabase
    .from("story_cluster_items")
    .update({ article_id: articleId })
    .eq("cluster_id", clusterResult.clusterId)
    .eq("source_item_id", item.id);

  return { articleId, clusterId: clusterResult.clusterId };
}

export async function createReviewArticleFromItem(
  supabase: SupabaseClient,
  source: IngestionSource,
  item: IngestionItem,
  processingNote: string
): Promise<{ articleId: string; clusterId: string }> {
  // 1. Resolve Category & Country
  const { categoryId, categorySlug } = await resolveCategoryId(supabase, source, item);
  const countryCode = inferCountryCode(source.country_code ?? item.country_code, item.title, item.description);

  // 2. Story Clustering & Duplicate Aggregation
  let clusterResult: ClusterMatchResult;
  try {
    clusterResult = await clusterSourceItem(
      supabase,
      item.id,
      item.title,
      item.description,
      categoryId,
      countryCode
    );
  } catch (err) {
    console.error("Clustering fallback:", err);
    clusterResult = {
      clusterId: item.id,
      isNewCluster: true,
      itemCount: 1,
      similarityScore: 1.0,
      matchMethod: "TITLE_HASH" as const
    };
  }

  // 3. Developing Story Check: If an article is already linked to this story cluster, update it in place!
  if (clusterResult.existingArticleId) {
    return await appendDevelopingUpdateToArticle(
      supabase,
      clusterResult.existingArticleId,
      source,
      item,
      clusterResult
    );
  }

  // 4. Journalistic Synthesis (Full TWNS Report)
  const report = await synthesizeJournalisticReport({
    title: item.title,
    description: item.description,
    sourceName: source.name,
    originalUrl: item.canonical_url,
    publishedAt: item.source_published_at,
    categorySlug,
    countryName: countryCode ?? undefined,
    clusterItemCount: clusterResult.itemCount
  });

  // 5. Create Master Article in news_articles
  const initialArticleType = report.articleType || inferArticleType(item.title, item.description);
  const { data: article, error: articleError } = await supabase
    .from("news_articles")
    .insert({
      slug: articleSlug(report.title, item.id),
      title: report.title,
      summary: report.summary,
      content: report.content,
      original_url: item.canonical_url,
      source_name: source.name,
      author: item.author,
      country_code: countryCode,
      language_code: item.language_code ?? "en",
      category_id: categoryId,
      status: "REVIEW",
      article_type: initialArticleType,
      source_published_at: item.source_published_at,
      metadata: {
        attribution: report.attributionNote,
        processing: processingNote,
        cluster_id: clusterResult.clusterId,
        verified_sources_count: clusterResult.itemCount,
        match_method: clusterResult.matchMethod
      }
    })
    .select("id")
    .single();

  if (articleError || !article) throw articleError ?? new Error("Unable to create article.");

  // 6. Link to article_sources
  await supabase.from("article_sources").insert({
    article_id: article.id,
    source_id: source.id,
    original_url: item.canonical_url
  });

  // 7. Record Initial Revision Snapshot (v1)
  await supabase.from("article_revisions").insert({
    article_id: article.id,
    version: 1,
    title: report.title,
    summary: report.summary,
    content: report.content,
    change_reason: `Initial automated synthesis from ${source.name}`
  });

  // 8. Link Story Cluster Item to this new article
  await supabase
    .from("story_cluster_items")
    .update({ article_id: article.id })
    .eq("cluster_id", clusterResult.clusterId)
    .eq("source_item_id", item.id);

  // 9. Policy Flags Check
  const flags = policyFlags(item.title, item.description);
  if (flags.length) {
    await supabase.from("editorial_flags").insert(
      flags.map((flag) => ({
        article_id: article.id,
        flag_type: flag.flagType,
        severity: flag.severity,
        reason: flag.reason
      }))
    );
  }

  // 10. Update source_item processing status
  await supabase
    .from("source_items")
    .update({
      article_id: article.id,
      processing_status: "PROCESSED"
    })
    .eq("id", item.id);

  return { articleId: article.id, clusterId: clusterResult.clusterId };
}
