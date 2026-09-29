import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";

// Use either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("news_articles").update({ status: "PUBLISHED", published_at: new Date().toISOString() }).eq("id", id).in("status", ["REVIEW", "APPROVED"]).select("id, status, published_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ article: data });
}