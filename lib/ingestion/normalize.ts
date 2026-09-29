import { createHash } from "node:crypto";
import type { NormalizedNewsItem, ValidationResult } from "./types";

const trackingParameters = new Set(["fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src"]);

export function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  const keys: string[] = [];
  url.searchParams.forEach((_, key) => keys.push(key));
  keys.forEach((key) => {
    if (key.toLowerCase().startsWith("utm_") || trackingParameters.has(key.toLowerCase())) url.searchParams.delete(key);
  });
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  return url.toString();
}

export function normalizeTitle(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\w\s\u00C0-\uFFFF]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizedHash(title: string, url: string): string {
  return createHash("sha256").update(`${normalizeTitle(title)}|${canonicalizeUrl(url)}`).digest("hex");
}

export function validateNewsItem(item: NormalizedNewsItem): ValidationResult {
  const errors: string[] = [];
  if (!item.title.trim()) errors.push("A title is required.");
  try { new URL(item.url); } catch { errors.push("The source URL is invalid."); }
  if (!item.sourceId) errors.push("A source is required.");
  return { valid: errors.length === 0, errors };
}