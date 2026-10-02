import Parser from "rss-parser";
import { canonicalizeUrl, normalizedHash, validateNewsItem } from "./normalize";
import type { NewsSourceAdapter, NormalizedNewsItem, NewsSource, SourceFetchResult, ValidationResult } from "./types";

type RssItem = Parser.Item & { guid?: string; id?: string; creator?: string; author?: string };

export class RssSourceAdapter implements NewsSourceAdapter {
  private readonly parser = new Parser<RssItem>({ timeout: 10_000 });

  async fetch(source: NewsSource): Promise<SourceFetchResult> {
    const response = await fetch(source.endpoint, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        ...(source.etag ? { "If-None-Match": source.etag } : {}),
        ...(source.last_modified ? { "If-Modified-Since": source.last_modified } : {})
      },
      signal: AbortSignal.timeout(10_000)
    });
    if (response.status === 304) return { items: [], statusCode: 304, etag: source.etag ?? null, lastModified: source.last_modified ?? null };
    if (!response.ok) throw new Error(`RSS request failed with HTTP ${response.status}.`);
    const xml = await response.text();
    const feed = await this.parser.parseString(xml);
    const items = feed.items.flatMap((item) => {
      if (!item.title || !item.link) return [];
      const normalized = this.normalize(item, source);
      return this.validate(normalized).valid ? [normalized] : [];
    });
    return { items, statusCode: response.status, etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified") };
  }

  normalize(item: unknown, source: NewsSource): NormalizedNewsItem {
    const rssItem = item as RssItem;
    const url = rssItem.link ?? "";
    const title = rssItem.title?.trim() ?? "";

    return {
      externalId: rssItem.guid ?? rssItem.id ?? null,
      title,
      description: rssItem.contentSnippet?.trim() ?? rssItem.content?.trim() ?? null,
      url,
      canonicalUrl: canonicalizeUrl(url),
      publishedAt: rssItem.isoDate ?? rssItem.pubDate ?? null,
      author: rssItem.creator ?? rssItem.author ?? null,
      languageCode: source.language_code ?? null,
      countryCode: source.country_code ?? null,
      sourceId: source.id,
      sourceName: source.name || "TWNS NEWS",
      normalizedHash: normalizedHash(title, url)
    };
  }

  validate(item: NormalizedNewsItem): ValidationResult {
    return validateNewsItem(item);
  }
}