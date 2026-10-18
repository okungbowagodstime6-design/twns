import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!secretKeysRaw) throw new Error("SUPABASE_SECRET_KEYS is required");

const secretKeys = JSON.parse(secretKeysRaw) as Record<string, string>;
const serviceKey = Object.values(secretKeys)[0];
if (!serviceKey) throw new Error("At least one Supabase secret key is required");

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

interface NewsSource {
  id: string;
  name: string;
  endpoint: string;
  category_id: string | null;
  country_code: string | null;
  language_code: string | null;
  polling_interval_minutes: number;
  consecutive_failures: number;
  total_successes: number;
  total_failures: number;
}

interface FeedItem {
  title: string;
  url: string;
  description: string;
  author: string;
  published: string;
  externalId: string;
}

function text(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/\s+/g, " ")
    .trim();
}

function field(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? text(match[1]) : "";
}

function itemLink(block: string): string {
  const link = block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i);
  if (link) return text(link[1]);
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return href?.[1]?.trim() ?? field(block, "guid") ?? field(block, "id");
}

function parseFeed(xml: string): FeedItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  return blocks.flatMap((match) => {
    const block = match[2];
    const title = field(block, "title").slice(0, 500);
    const url = itemLink(block);
    if (!title || !url) return [];

    return [{
      title,
      url,
      description: (field(block, "description") || field(block, "summary") || field(block, "content")).slice(0, 5000),
      author: field(block, "author") || field(block, "dc:creator"),
      published: field(block, "pubDate") || field(block, "published") || field(block, "updated"),
      externalId: field(block, "guid") || field(block, "id")
    }];
  });
}

function canonicalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "article";
}

async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyCronToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const { data, error } = await db.rpc("is_valid_rss_ingest_cron_token", { presented_token: token });
  return !error && data === true;
}

async function ingestSource(source: NewsSource) {
  const startedAt = Date.now();
  const now = new Date().toISOString();
  const { data: run, error: runError } = await db
    .from("ingestion_runs")
    .insert({ source_id: source.id, status: "RUNNING" })
    .select("id")
    .single();

  if (runError || !run) throw runError ?? new Error("Unable to create ingestion run.");

  try {
    const response = await fetch(source.endpoint, {
      headers: {
        "User-Agent": "TWNS RSS Ingestion/1.0",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`RSS returned HTTP ${response.status}`);

    const items = parseFeed(await response.text());
    let created = 0;
    let skipped = 0;

    for (const item of items) {
      const url = canonicalUrl(item.url);
      if (!url) {
        skipped++;
        continue;
      }

      const fingerprint = await hash(`${source.id}:${url}`);
      const { data: existing, error: existingError } = await db
        .from("source_items")
        .select("id, article_id")
        .eq("source_id", source.id)
        .eq("canonical_url", url)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing?.article_id) {
        skipped++;
        continue;
      }

      let sourceItemId = existing?.id as string | undefined;
      if (!sourceItemId) {
        const { data: sourceItem, error: sourceItemError } = await db.from("source_items").upsert({
          source_id: source.id,
          external_id: item.externalId || null,
          canonical_url: url,
          title: item.title,
          description: item.description || null,
          author: item.author || null,
          source_published_at: item.published && !Number.isNaN(Date.parse(item.published)) ? new Date(item.published).toISOString() : null,
          language_code: source.language_code || "en",
          country_code: source.country_code,
          normalized_hash: fingerprint,
          last_seen_at: now,
          processing_status: "NORMALIZED"
        }, { onConflict: "source_id,canonical_url" })
          .select("id")
          .single();
        if (sourceItemError || !sourceItem) throw sourceItemError ?? new Error("Unable to save the source item.");
        sourceItemId = sourceItem.id;
      }

      const publishedAt = item.published && !Number.isNaN(Date.parse(item.published))
        ? new Date(item.published).toISOString()
        : now;
      const slug = `${slugify(item.title)}-${fingerprint.slice(0, 10)}`;
      const { data: article, error: articleError } = await db.from("news_articles").insert({
        slug,
        title: item.title,
        summary: item.description || null,
        content: item.description || null,
        original_url: url,
        source_name: source.name,
        author: item.author || null,
        country_code: source.country_code,
        language_code: source.language_code || "en",
        category_id: source.category_id,
        status: "REVIEW",
        article_type: "STANDARD",
        source_published_at: publishedAt,
        metadata: { ingestion: "rss", source_id: source.id, external_id: item.externalId || null }
      }).select("id").single();
      if (articleError || !article) throw articleError ?? new Error("Unable to create review article.");

      const { error: linkError } = await db.from("article_sources").upsert({
        article_id: article.id,
        source_id: source.id,
        original_url: url
      }, { onConflict: "article_id,source_id" });
      if (linkError) throw linkError;

      const { error: updateError } = await db.from("source_items").update({
        article_id: article.id,
        processing_status: "REVIEW"
      }).eq("id", sourceItemId);
      if (updateError) throw updateError;
      created++;
    }

    await db.from("news_sources").update({
      last_run_at: now,
      last_success_at: now,
      last_error_at: null,
      consecutive_failures: 0,
      total_successes: source.total_successes + 1,
      next_run_at: new Date(Date.now() + (source.polling_interval_minutes || 30) * 60_000).toISOString(),
      health_status: "HEALTHY"
    }).eq("id", source.id);

    await db.from("ingestion_runs").update({
      completed_at: new Date().toISOString(),
      status: "COMPLETED",
      items_fetched: items.length,
      items_created: created,
      items_skipped: skipped,
      duration_ms: Date.now() - startedAt
    }).eq("id", run.id);

    return { sourceId: source.id, status: "COMPLETED", fetched: items.length, created, skipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.from("news_sources").update({
      last_run_at: now,
      last_error_at: now,
      consecutive_failures: source.consecutive_failures + 1,
      total_failures: source.total_failures + 1,
      health_status: source.consecutive_failures + 1 >= 3 ? "FAILING" : "WARNING"
    }).eq("id", source.id);
    await db.from("ingestion_runs").update({
      completed_at: new Date().toISOString(),
      status: "FAILED",
      error_message: message,
      duration_ms: Date.now() - startedAt
    }).eq("id", run.id);
    return { sourceId: source.id, status: "FAILED", error: message };
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!await verifyCronToken(request.headers.get("x-cron-token"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { data: sources, error } = await db.from("news_sources")
    .select("id,name,endpoint,category_id,country_code,language_code,polling_interval_minutes,consecutive_failures,total_successes,total_failures")
    .eq("is_active", true)
    .eq("source_type", "RSS")
    .or(`next_run_at.is.null,next_run_at.lte.${now}`);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const source of (sources ?? []) as NewsSource[]) results.push(await ingestSource(source));
  return Response.json({ ok: true, sources: results, processed_at: new Date().toISOString() });
});