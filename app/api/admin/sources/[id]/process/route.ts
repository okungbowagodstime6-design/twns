import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";
import { createReviewArticleFromItem } from "@/lib/ingestion/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: source, error: sourceError } = await auth.supabase.from("news_sources").select("id, name, category_id, country_code").eq("id", id).single();
  if (sourceError || !source) return NextResponse.json({ error: "Source not found." }, { status: 404 });

  const { data: items, error: itemError } = await auth.supabase
    .from("source_items")
    .select("id, title, description, author, canonical_url, source_published_at, language_code, country_code, article_id")
    .eq("source_id", source.id)
    .is("article_id", null)
    .in("processing_status", ["DISCOVERED", "NORMALIZED"])
    .order("source_published_at", { ascending: false });
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  let created = 0;
  for (const item of items ?? []) {
    try {
      await createReviewArticleFromItem(auth.supabase, source, item, "Normalized source item; editorial review required.");
      created += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Article creation failed.";
      return NextResponse.json({ error: message, created }, { status: 500 });
    }
  }

  return NextResponse.json({ sourceId: source.id, discovered: items?.length ?? 0, created, skipped: (items?.length ?? 0) - created });
}