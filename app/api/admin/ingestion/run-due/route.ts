import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adapterForSource } from "@/lib/ingestion/adapters";
import { createReviewArticleFromItem } from "@/lib/ingestion/articles";
import { withRetry } from "@/lib/ingestion/retry";
import type { NewsSource } from "@/lib/ingestion/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}


export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();
    const { data: sources, error: sourceError } = await supabase
      .from("news_sources")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now);
    if (sourceError) throw sourceError;

    const results = await Promise.all((sources as NewsSource[]).map((source) => processSource(supabase, source)));
    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run due sources.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

async function processSource(supabase: ReturnType<typeof createServerSupabaseClient>, source: NewsSource) {
  const startedAt = Date.now();
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ source_id: source.id, status: "RUNNING" })
    .select("id")
    .single();
  if (runError || !run) throw runError ?? new Error("Unable to create ingestion run.");

  try {
    const adapter = adapterForSource(source);
    const fetched = await withRetry(() => adapter.fetch(source));
    let created = 0;
    let skipped = 0;
    for (const item of fetched.items) {
      const { data: insertedItems, error } = await supabase.from("source_items").upsert({
        source_id: item.sourceId,
        external_id: item.externalId,
        canonical_url: item.canonicalUrl,
        title: item.title,
        description: item.description,
        author: item.author,
        source_published_at: item.publishedAt,
        language_code: item.languageCode,
        country_code: item.countryCode,
        normalized_hash: item.normalizedHash,
        last_seen_at: new Date().toISOString(),
        processing_status: "NORMALIZED"
      }, { onConflict: "source_id,canonical_url", ignoreDuplicates: true }).select("id");
      if (error) throw error;
      if (insertedItems?.length) created += 1;
    }
    skipped = fetched.items.length - created;
    const { data: pendingItems, error: pendingError } = await supabase
      .from("source_items")
      .select("id, title, description, author, canonical_url, source_published_at, language_code, country_code")
      .eq("source_id", source.id)
      .is("article_id", null)
      .in("processing_status", ["DISCOVERED", "NORMALIZED"]);
    if (pendingError) throw pendingError;
    let articlesCreated = 0;
    for (const item of pendingItems ?? []) {
      await createReviewArticleFromItem(supabase, source, item, "Automated ingestion; editorial review required.");
      articlesCreated += 1;
    }
    await supabase.from("news_sources").update({
      last_success_at: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + (source.polling_interval_minutes || 30) * 60_000).toISOString(),
      consecutive_failures: 0,
      total_successes: (source.total_successes || 0) + 1,
      health_status: "HEALTHY",
      etag: fetched.etag,
      last_modified: fetched.lastModified
    }).eq("id", source.id);
    await supabase.from("ingestion_runs").update({
      completed_at: new Date().toISOString(), status: "COMPLETED", items_fetched: fetched.items.length,
      items_created: created, items_skipped: skipped, duration_ms: Date.now() - startedAt
    }).eq("id", run.id);
    return { sourceId: source.id, status: "COMPLETED", fetched: fetched.items.length, created, skipped, articlesCreated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Source processing failed.";
    await supabase.from("news_sources").update({
      last_error_at: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
      consecutive_failures: (source.consecutive_failures || 0) + 1,
      total_failures: (source.total_failures || 0) + 1,
      health_status: (source.consecutive_failures || 0) + 1 >= 3 ? "FAILING" : "WARNING"
    }).eq("id", source.id);
    await supabase.from("ingestion_runs").update({ completed_at: new Date().toISOString(), status: "FAILED", error_message: message, duration_ms: Date.now() - startedAt }).eq("id", run.id);
    return { sourceId: source.id, status: "FAILED", error: message };
  }
}