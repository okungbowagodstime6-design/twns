import type { SupabaseClient } from "@supabase/supabase-js";

export type ClusterMatchResult = {
  clusterId: string;
  isNewCluster: boolean;
  itemCount: number;
  similarityScore: number;
  matchMethod: "EXACT_URL" | "TITLE_HASH" | "KEYWORD_SIMILARITY" | "ENTITY_MATCH";
  existingArticleId?: string | null;
};

// Common stopwords to exclude from headline tokenization
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "about", "against", "between", "into", "through", "during", "before",
  "after", "above", "below", "from", "up", "down", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
  "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
  "t", "can", "will", "just", "don", "should", "now", "says", "said", "after",
  "amid", "new", "live", "update", "updates", "watch", "video", "report"
]);

/**
 * Extract clean, significant keywords from headline and description
 */
export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Compute Jaccard similarity between two keyword sets
 */
export function computeSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Cluster an incoming source item against active clusters from the last 48 hours
 */
export async function clusterSourceItem(
  supabase: SupabaseClient,
  sourceItemId: string,
  title: string,
  description: string | null,
  categoryId: string | null,
  countryCode: string | null
): Promise<ClusterMatchResult> {
  const itemKeywords = extractKeywords(`${title} ${description ?? ""}`);
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // 1. Fetch active clusters from the last 48 hours
  const { data: activeClusters, error: clusterError } = await supabase
    .from("story_clusters")
    .select("id, canonical_title, slug, status")
    .eq("status", "ACTIVE")
    .gte("last_updated_at", since)
    .order("last_updated_at", { ascending: false })
    .limit(50);

  if (clusterError) {
    console.error("Cluster lookup error:", clusterError);
  }

  // 2. Find best matching cluster based on title & keyword similarity
  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const cluster of activeClusters ?? []) {
    const clusterKeywords = extractKeywords(cluster.canonical_title);
    const score = computeSimilarity(itemKeywords, clusterKeywords);

    // Overlap threshold for same news event across different outlets
    if (score > highestScore && score >= 0.35) {
      highestScore = score;
      bestMatchId = cluster.id;
    }
  }

  // 3. If matching cluster found, associate this source item
  if (bestMatchId) {
    await supabase.from("story_cluster_items").upsert({
      cluster_id: bestMatchId,
      source_item_id: sourceItemId,
      similarity_score: Math.min(0.9999, highestScore),
      match_method: "KEYWORD_SIMILARITY"
    }, { onConflict: "cluster_id,source_item_id" });

    // Update cluster last_updated_at timestamp and set to DEVELOPING if multi-source
    await supabase
      .from("story_clusters")
      .update({
        last_updated_at: new Date().toISOString(),
        status: "DEVELOPING"
      })
      .eq("id", bestMatchId);

    // Get current item count in this cluster and check if an article is already linked
    const [{ count }, { data: existingArticleRow }] = await Promise.all([
      supabase
        .from("story_cluster_items")
        .select("id", { count: "exact", head: true })
        .eq("cluster_id", bestMatchId),
      supabase
        .from("story_cluster_items")
        .select("article_id")
        .eq("cluster_id", bestMatchId)
        .not("article_id", "is", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    return {
      clusterId: bestMatchId,
      isNewCluster: false,
      itemCount: count ?? 2,
      similarityScore: highestScore,
      matchMethod: "KEYWORD_SIMILARITY",
      existingArticleId: existingArticleRow?.article_id ?? null
    };
  }

  // 4. Otherwise, create a new story cluster
  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  const clusterSlug = `${slugBase || "event"}-${sourceItemId.slice(0, 8)}`;

  const { data: newCluster, error: createError } = await supabase
    .from("story_clusters")
    .insert({
      canonical_title: title,
      slug: clusterSlug,
      category_id: categoryId,
      country_code: countryCode,
      status: "ACTIVE",
      first_seen_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (createError || !newCluster) {
    throw createError ?? new Error("Failed to create story cluster");
  }

  // Link item to the newly created cluster
  await supabase.from("story_cluster_items").insert({
    cluster_id: newCluster.id,
    source_item_id: sourceItemId,
    similarity_score: 1.0,
    match_method: "TITLE_HASH"
  });

  return {
    clusterId: newCluster.id,
    isNewCluster: true,
    itemCount: 1,
    similarityScore: 1.0,
    matchMethod: "TITLE_HASH"
  };
}
