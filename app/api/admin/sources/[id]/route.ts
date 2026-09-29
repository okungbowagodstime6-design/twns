import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";
import { adapterForSource } from "@/lib/ingestion/adapters";
import { withRetry } from "@/lib/ingestion/retry";
import type { NewsSource } from "@/lib/ingestion/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSource(request: NextRequest, id: string) {
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return auth;
  const { data: source, error } = await auth.supabase.from("news_sources").select("*").eq("id", id).single();
  if (error || !source) return { error: "Source not found.", status: 404 as const };
  return { ...auth, source: source as NewsSource };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await getSource(request, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!("source" in result)) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "A JSON body is required." }, { status: 400 });
  const update: Record<string, unknown> = {};
  for (const field of ["name", "endpoint", "country_code", "language_code", "health_status"]) {
    if (field in body && typeof body[field] === "string") update[field] = body[field];
  }
  if ("is_active" in body && typeof body.is_active === "boolean") update.is_active = body.is_active;
  if ("polling_interval_minutes" in body && typeof body.polling_interval_minutes === "number" && body.polling_interval_minutes > 0) {
    update.polling_interval_minutes = body.polling_interval_minutes;
  }
  if ("endpoint" in update) {
    try { new URL(String(update.endpoint)); } catch { return NextResponse.json({ error: "endpoint must be a valid URL." }, { status: 400 }); }
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "No valid changes supplied." }, { status: 400 });
  const { data, error } = await result.supabase.from("news_sources").update(update).eq("id", result.source.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await getSource(request, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!("source" in result)) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  try {
    const fetched = await adapterForSource(result.source).fetch(result.source);
    return NextResponse.json({
      success: true,
      statusCode: fetched.statusCode,
      itemsDiscovered: fetched.items.length,
      lastPublication: fetched.items[0]?.publishedAt ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Source connection failed.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await getSource(request, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!("source" in result)) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  const startedAt = Date.now();
  const { data: run, error: runError } = await result.supabase.from("ingestion_runs").insert({ source_id: result.source.id, status: "RUNNING" }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: runError?.message || "Unable to start ingestion." }, { status: 500 });
  try {
    const fetched = await withRetry(() => adapterForSource(result.source).fetch(result.source));
    let created = 0;
    for (const item of fetched.items) {
      const { data, error } = await result.supabase.from("source_items").upsert({
        source_id: item.sourceId, external_id: item.externalId, canonical_url: item.canonicalUrl,
        title: item.title, description: item.description, author: item.author,
        source_published_at: item.publishedAt, language_code: item.languageCode, country_code: item.countryCode,
        normalized_hash: item.normalizedHash, last_seen_at: new Date().toISOString(), processing_status: "NORMALIZED"
      }, { onConflict: "source_id,canonical_url", ignoreDuplicates: true }).select("id");
      if (error) throw error;
      if (data?.length) created += 1;
    }
    await result.supabase.from("ingestion_runs").update({ status: "COMPLETED", completed_at: new Date().toISOString(), items_fetched: fetched.items.length, items_created: created, items_skipped: fetched.items.length - created, duration_ms: Date.now() - startedAt }).eq("id", run.id);
    await result.supabase.from("news_sources").update({ last_success_at: new Date().toISOString(), last_run_at: new Date().toISOString(), consecutive_failures: 0, total_successes: (result.source.total_successes || 0) + 1, health_status: "HEALTHY", etag: fetched.etag, last_modified: fetched.lastModified }).eq("id", result.source.id);
    return NextResponse.json({ status: "COMPLETED", fetched: fetched.items.length, created, skipped: fetched.items.length - created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed.";
    await result.supabase.from("ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), error_message: message, duration_ms: Date.now() - startedAt }).eq("id", run.id);
    await result.supabase.from("news_sources").update({ last_error_at: new Date().toISOString(), last_run_at: new Date().toISOString(), consecutive_failures: (result.source.consecutive_failures || 0) + 1, total_failures: (result.source.total_failures || 0) + 1, health_status: "WARNING" }).eq("id", result.source.id);
    return NextResponse.json({ status: "FAILED", error: message }, { status: 502 });
  }
}