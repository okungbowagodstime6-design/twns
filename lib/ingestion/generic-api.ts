import { canonicalizeUrl, normalizedHash, validateNewsItem } from "./normalize";
import type { NewsSourceAdapter, NormalizedNewsItem, NewsSource, SourceFetchResult, ValidationResult } from "./types";

type ApiConfig = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  query?: Record<string, string>;
  itemsPath?: string;
  fields?: { id?: string; title: string; description?: string; url: string; publishedAt?: string; author?: string };
  apiKeyEnv?: string;
  apiKeyHeader?: string;
};

function valueAtPath(payload: unknown, path: string | undefined): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), payload);
}

export class GenericApiSourceAdapter implements NewsSourceAdapter {
  async fetch(source: NewsSource): Promise<SourceFetchResult> {
    const config = (source.config ?? {}) as ApiConfig;
    const url = new URL(source.endpoint);
    Object.entries(config.query ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
    const headers: Record<string, string> = { Accept: "application/json", ...(config.headers ?? {}) };
    if (config.apiKeyEnv && config.apiKeyHeader) {
      const key = process.env[config.apiKeyEnv];
      if (!key) throw new Error(`API credential ${config.apiKeyEnv} is not configured.`);
      headers[config.apiKeyHeader] = key;
    }
    const response = await fetch(url, { method: config.method ?? "GET", headers, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      const error = new Error(`API request failed with HTTP ${response.status}.`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    const payload = await response.json() as unknown;
    const rawItems = valueAtPath(payload, config.itemsPath) ?? payload;
    const items = Array.isArray(rawItems) ? rawItems.flatMap((item) => {
      const normalized = this.normalize(item, source);
      return this.validate(normalized).valid ? [normalized] : [];
    }) : [];
    return { items, statusCode: response.status, etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified") };
  }

  normalize(item: unknown, source: NewsSource): NormalizedNewsItem {
    const config = (source.config ?? {}) as ApiConfig;
    const fields = config.fields ?? { title: "title", url: "url" };
    const read = (path: string | undefined) => valueAtPath(item, path);
    const title = String(read(fields.title) ?? "");
    const url = String(read(fields.url) ?? "");
    let canonicalUrl = "";
    if (url) {
      try { canonicalUrl = canonicalizeUrl(url); } catch { canonicalUrl = ""; }
    }
    return {
      externalId: fields.id ? String(read(fields.id) ?? "") || null : null,
      title,
      description: fields.description ? String(read(fields.description) ?? "") || null : null,
      url,
      canonicalUrl,
      publishedAt: fields.publishedAt ? String(read(fields.publishedAt) ?? "") || null : null,
      author: fields.author ? String(read(fields.author) ?? "") || null : null,
      languageCode: source.language_code ?? null,
      countryCode: source.country_code ?? null,
      sourceId: source.id,
      sourceName: source.name,
      normalizedHash: url ? normalizedHash(title, url) : ""
    };
  }

  validate(item: NormalizedNewsItem): ValidationResult {
    return validateNewsItem(item);
  }
}