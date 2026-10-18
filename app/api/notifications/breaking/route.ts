import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendBreakingNewsEmail, type BreakingNewsTargetUser } from "@/lib/email/resend";
import type { BreakingNewsArticle } from "@/lib/email/templates";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;
type SubscriberProfile = { id: string; country_code: string | null; display_name: string | null };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesSecret(received: string | null, expected: string) {
  if (!received) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toArticle(record: JsonObject): BreakingNewsArticle | null {
  const title = stringValue(record.title);
  const slug = stringValue(record.slug);
  const category = stringValue(record.category) || "News";
  const excerpt = stringValue(record.excerpt) || stringValue(record.summary);
  const country = stringValue(record.country_code);
  const metadata = isObject(record.metadata) ? record.metadata : {};
  const imageUrl = stringValue(record.featured_image_url) || stringValue(metadata.image_url);
  if (!title || !slug) return null;

  return {
    title,
    slug,
    excerpt,
    category,
    country_code: country || null,
    featured_image_url: imageUrl || null
  };
}

async function getSubscribers(countryCode: string | null) {
  const supabase = createServerSupabaseClient();
  const normalizedCountry = countryCode?.toUpperCase() ?? "";
  const isGlobal = !normalizedCountry || ["ALL", "GLOBAL", "WORLD", "WORLDWIDE"].includes(normalizedCountry);
  const profiles: SubscriberProfile[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    let query = supabase.from("profiles").select("id, country_code, display_name").eq("breaking_alerts_enabled", true).order("id").range(from, from + pageSize - 1);
    if (!isGlobal) query = query.eq("country_code", normalizedCountry);
    const { data, error } = await query;
    if (error) throw new Error(`Subscriber lookup failed: ${error.message}`);
    profiles.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const remainingIds = new Set(profilesById.keys());
  const recipients: BreakingNewsTargetUser[] = [];
  const perPage = 1000;
  for (let page = 1; remainingIds.size > 0; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Subscriber email lookup failed: ${error.message}`);
    for (const user of data.users) {
      if (!remainingIds.delete(user.id) || !user.email) continue;
      const profile = profilesById.get(user.id);
      recipients.push({ email: user.email, fullName: profile?.display_name || stringValue(user.user_metadata?.full_name) || null });
    }
    if (data.users.length < perPage) break;
  }

  return recipients;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TWNS_WEBHOOK_SECRET;
  if (!expectedSecret) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  if (!matchesSecret(request.headers.get("x-twns-webhook-secret"), expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON payload is required." }, { status: 400 });
  }

  const envelope = isObject(payload) ? payload : null;
  const record = envelope && isObject(envelope.record) ? envelope.record : envelope;
  if (!record) return NextResponse.json({ error: "An article payload is required." }, { status: 400 });

  const breaking = record.is_breaking === true || (record.is_breaking === undefined && stringValue(record.article_type).toUpperCase() === "BREAKING");
  if (!breaking) return NextResponse.json({ skipped: true, reason: "Article is not marked as breaking." });
  const status = stringValue(record.status).toUpperCase();
  if (status && status !== "PUBLISHED") return NextResponse.json({ skipped: true, reason: "Article is not published." });

  const article = toArticle(record);
  if (!article) return NextResponse.json({ error: "Article title and slug are required." }, { status: 400 });

  try {
    const recipients = await getSubscribers(article.country_code ?? null);
    const result = await sendBreakingNewsEmail(article, recipients);
    return NextResponse.json({ ok: true, recipients: recipients.length, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Breaking-news dispatch failed.";
    console.error("Breaking-news notification failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}