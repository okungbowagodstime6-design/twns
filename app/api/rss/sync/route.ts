import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { generateArticleBreakdown } from "@/lib/ingestion/rss-analysis";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser({ timeout: 15_000 });
const maxFeedBytes = 5 * 1024 * 1024;
const hashBatchSize = 100;

type ActiveFeed = {
  id: string;
  name: string;
  url: string;
  category: string;
  country_code: string;
  sub_category: string;
  main_category: string;
  feed_table: "feeds" | "news_feeds";
};

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("RSS item URL must use HTTP or HTTPS.");
  }
  url.hash = "";
  const trackingKeys: string[] = [];
  url.searchParams.forEach((_, key) => {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|ref_src$)/i.test(key)) trackingKeys.push(key);
  });
  trackingKeys.forEach((key) => url.searchParams.delete(key));
  return url.toString();
}

function articleSlug(title: string, urlHash: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
  return `${slug || "article"}-${urlHash.slice(0, 12)}`;
}

async function fetchFeed(feed: ActiveFeed) {
  const feedUrl = new URL(feed.url);
  if (feedUrl.protocol !== "https:" && feedUrl.protocol !== "http:") {
    throw new Error("Feed URL must use HTTP or HTTPS.");
  }

  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "TWNS RSS Sync/1.0"
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`RSS request failed with HTTP ${response.status}.`);

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxFeedBytes) {
    throw new Error(`RSS response exceeds the ${maxFeedBytes}-byte limit.`);
  }

  const xml = await response.text();
  if (Buffer.byteLength(xml, "utf8") > maxFeedBytes) {
    throw new Error(`RSS response exceeds the ${maxFeedBytes}-byte limit.`);
  }
  return parser.parseString(xml);
}

async function existingHashes(supabase: ReturnType<typeof createServerSupabaseClient>, hashes: string[]) {
  const articles = new Set<string>();
  const newsArticles = new Set<string>();
  for (let index = 0; index < hashes.length; index += hashBatchSize) {
    const batch = hashes.slice(index, index + hashBatchSize);
    const [{ data: articleRows, error: articleError }, { data: newsArticleRows, error: newsArticleError }] = await Promise.all([
      supabase
      .from("articles")
      .select("source_url_hash")
      .in("source_url_hash", batch),
      supabase
        .from("news_articles")
        .select("source_url_hash")
        .in("source_url_hash", batch)
    ]);
    if (articleError) throw new Error(`Unable to check existing article URLs: ${articleError.message}`);
    if (newsArticleError) throw new Error(`Unable to check published-news article URLs: ${newsArticleError.message}`);
    for (const article of articleRows ?? []) articles.add(article.source_url_hash);
    for (const article of newsArticleRows ?? []) {
      if (article.source_url_hash) newsArticles.add(article.source_url_hash);
    }
  }
  return { articles, newsArticles };
}

async function syncFeed(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  feed: ActiveFeed
) {
  const result = { feedId: feed.id, fetched: 0, inserted: 0, skipped: 0, errors: [] as string[] };

  try {
    const parsedFeed = await fetchFeed(feed);
    const isHealthFeed = feed.main_category.toLowerCase() === "health" || feed.category.toLowerCase() === "health";
    let healthCategoryId: string | null = null;
    if (isHealthFeed) {
      const { data: healthCategory, error } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "health")
        .maybeSingle();
      if (error) throw new Error(`Unable to resolve the Health category: ${error.message}`);
      if (!healthCategory) throw new Error("Health category is missing; apply the Health category migration before syncing feeds.");
      healthCategoryId = healthCategory.id;
    }

    const seenHashes = new Set<string>();
    const items = parsedFeed.items.flatMap((item) => {
      if (!item.title?.trim() || !item.link?.trim()) return [];
      try {
        const sourceUrl = canonicalizeUrl(item.link);
        const sourceUrlHash = createHash("md5").update(sourceUrl).digest("hex");
        if (seenHashes.has(sourceUrlHash)) {
          result.skipped += 1;
          return [];
        }
        seenHashes.add(sourceUrlHash);
        return [{ item, sourceUrl, sourceUrlHash }];
      } catch (error) {
        result.skipped += 1;
        result.errors.push(error instanceof Error ? error.message : "RSS item URL is invalid.");
        return [];
      }
    });
    result.fetched = parsedFeed.items.length;
    const storedHashes = await existingHashes(supabase, items.map(({ sourceUrlHash }) => sourceUrlHash));
    for (const { item, sourceUrl, sourceUrlHash } of items) {
      const existsInArticles = storedHashes.articles.has(sourceUrlHash);
      const existsInNewsArticles = storedHashes.newsArticles.has(sourceUrlHash);
      if (existsInArticles && existsInNewsArticles) {
        result.skipped += 1;
        continue;
      }

      const sourceText = [item.content, item.contentSnippet, item.summary]
        .filter((part): part is string => Boolean(part?.trim()))
        .join("\n\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 20_000);

      try {
        const breakdown = await generateArticleBreakdown({
          title: item.title!.trim(),
          content: sourceText || item.title!.trim(),
          sourceName: feed.name,
          category: feed.sub_category === "general" ? feed.category : `${feed.category}: ${feed.sub_category}`
        });
        const publishedDate = item.isoDate || item.pubDate;
        const publishedAt = publishedDate && !Number.isNaN(Date.parse(publishedDate))
          ? new Date(publishedDate).toISOString()
          : new Date().toISOString();
        let inserted = false;
        const articleData = {
          title: item.title!.trim(),
          slug: articleSlug(item.title!, sourceUrlHash),
          category: feed.category,
          summary_bullets: breakdown.summary_bullets,
          full_analysis: breakdown.full_analysis,
          source_url: sourceUrl,
          source_url_hash: sourceUrlHash,
          source_name: feed.name,
          published_at: publishedAt,
          country_code: feed.country_code,
          sub_category: feed.sub_category,
          main_category: feed.main_category
        };

        if (!existsInArticles) {
          const { data, error } = await supabase
            .from("articles")
            .upsert(articleData, { onConflict: "source_url_hash", ignoreDuplicates: true })
            .select("id");
          if (error) throw new Error(`Unable to save the RSS article: ${error.message}`);
          inserted = Boolean(data?.length);
          storedHashes.articles.add(sourceUrlHash);
        }

        if (!existsInNewsArticles) {
          const { data, error } = await supabase
            .from("news_articles")
            .upsert({
              slug: articleData.slug,
              title: articleData.title,
              summary: breakdown.summary_bullets.map((bullet) => `• ${bullet}`).join("\n"),
              content: breakdown.full_analysis,
              original_url: sourceUrl,
              source_url_hash: sourceUrlHash,
              source_name: feed.name,
              ...(healthCategoryId ? { category_id: healthCategoryId } : {}),
              country_code: feed.country_code === "GLOBAL" ? null : feed.country_code,
              main_category: feed.main_category,
              sub_category: feed.sub_category,
              status: "REVIEW",
              article_type: feed.main_category === "breaking" ? "BREAKING" : "STANDARD",
              source_published_at: publishedAt,
              metadata: { ingestion: "rss", feed_id: feed.id, feed_table: feed.feed_table }
            }, { onConflict: "source_url_hash", ignoreDuplicates: true })
            .select("id");
          if (error) throw new Error(`Unable to create editorial-review article: ${error.message}`);
          inserted = Boolean(data?.length) || inserted;
          storedHashes.newsArticles.add(sourceUrlHash);
        }

        if (inserted) result.inserted += 1;
        else result.skipped += 1;
      } catch (error) {
        result.errors.push(`${item.title!.trim()}: ${error instanceof Error ? error.message : "Article processing failed."}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Feed processing failed.");
  }

  return result;
}

async function handleSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const [{ data: legacyFeeds, error: legacyError }, { data: countryFeeds, error: countryError }] = await Promise.all([
      supabase
        .from("feeds")
        .select("id, name, url, category, country_code, sub_category, main_category")
        .eq("is_active", true),
      supabase
        .from("news_feeds")
        .select("id, feed_name, feed_url, category, country_code, sub_category")
        .eq("is_active", true)
    ]);
    if (legacyError) throw new Error(`Unable to fetch active RSS feeds: ${legacyError.message}`);
    if (countryError) throw new Error(`Unable to fetch active country and special-category feeds: ${countryError.message}`);

    const feeds: ActiveFeed[] = [
      ...(legacyFeeds ?? []).map((feed) => ({
        ...feed,
        country_code: feed.country_code ?? "GLOBAL",
        sub_category: feed.sub_category ?? "general",
        main_category: feed.main_category ?? "general",
        feed_table: "feeds" as const
      })),
      ...(countryFeeds ?? []).map((feed) => ({
        id: feed.id,
        name: feed.feed_name,
        url: feed.feed_url,
        category: feed.category,
        country_code: feed.country_code,
        sub_category: feed.sub_category,
        main_category: feed.category,
        feed_table: "news_feeds" as const
      }))
    ];

    const results = await Promise.all(feeds.map((feed) => syncFeed(supabase, feed)));
    const failed = results.filter((result) => result.errors.length > 0).length;
    const status = failed ? 207 : 200;
    return NextResponse.json({
      feeds: results.length,
      inserted: results.reduce((total, result) => total + result.inserted, 0),
      skipped: results.reduce((total, result) => total + result.skipped, 0),
      failed,
      results
    }, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync RSS feeds.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
