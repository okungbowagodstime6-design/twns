import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("news_sources").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.name !== "string" || typeof body.endpoint !== "string" || typeof body.source_type !== "string") {
    return NextResponse.json({ error: "name, endpoint, and source_type are required." }, { status: 400 });
  }
  if (!["RSS", "API", "OFFICIAL", "PUBLISHER"].includes(body.source_type)) {
    return NextResponse.json({ error: "Unsupported source_type." }, { status: 400 });
  }
  try { new URL(body.endpoint); } catch { return NextResponse.json({ error: "endpoint must be a valid URL." }, { status: 400 }); }
  const { data, error } = await auth.supabase.from("news_sources").insert({
    name: body.name,
    endpoint: body.endpoint,
    source_type: body.source_type,
    country_code: typeof body.country_code === "string" ? body.country_code : null,
    language_code: typeof body.language_code === "string" ? body.language_code : null,
    polling_interval_minutes: typeof body.polling_interval_minutes === "number" && body.polling_interval_minutes > 0 ? body.polling_interval_minutes : 30,
    config: body.config && typeof body.config === "object" ? body.config : {}
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data }, { status: 201 });
}