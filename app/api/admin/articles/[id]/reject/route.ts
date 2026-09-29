import { NextRequest, NextResponse } from "next/server";
import { requireEditorialUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireEditorialUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null) as { reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "Rejected during editorial review.";
  const { data, error } = await auth.supabase.from("news_articles").update({ status: "REJECTED", metadata: { rejectionReason: reason } }).eq("id", id).in("status", ["REVIEW", "AI_PROCESSING", "NORMALIZED"]).select("id, status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ article: data });
}