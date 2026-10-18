import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";
import { policyFlags } from "@/lib/editorial/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugFromTitle(title: string, id: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${slug || "article"}-${id.slice(0, 8)}`;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: source, error: sourceError } = await auth.supabase.from("news_sources").select("id, name").eq("id", id).single();
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
    const { data: article, error: articleError } = await auth.supabase.from("news_articles").insert({
      slug: slugFromTitle(item.title, item.id),
      title: item.title,
      summary: item.description,
      original_url: item.canonical_url,
      source_name: source.name,
      author: item.author,
      country_code: item.country_code,
      language_code: item.language_code,
      status: "REVIEW",
      article_type: "STANDARD",
      source_published_at: item.source_published_at,
      metadata: { attribution: `Source: ${source.name}`, processing: "Normalized source item; editorial review required." }
    }).select("id").single();
    if (articleError || !article) return NextResponse.json({ error: articleError?.message || "Article creation failed.", created }, { status: 500 });

    const { error: linkError } = await auth.supabase.from("article_sources").insert({ article_id: article.id, source_id: source.id, original_url: item.canonical_url });
    if (linkError) return NextResponse.json({ error: linkError.message, created }, { status: 500 });
    const flags = policyFlags(item.title, item.description);
    if (flags.length) {
      const { error: flagError } = await auth.supabase.from("editorial_flags").insert(flags.map((flag) => ({ article_id: article.id, flag_type: flag.flagType, severity: flag.severity, reason: flag.reason })));
      if (flagError) return NextResponse.json({ error: flagError.message, created }, { status: 500 });
    }
    const { error: updateError } = await auth.supabase.from("source_items").update({ article_id: article.id, processing_status: "REVIEW" }).eq("id", item.id);
    if (updateError) return NextResponse.json({ error: updateError.message, created }, { status: 500 });
    created += 1;
  }

  return NextResponse.json({ sourceId: source.id, discovered: items?.length ?? 0, created, skipped: (items?.length ?? 0) - created });
}