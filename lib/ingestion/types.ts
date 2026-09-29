export type NewsSourceType = "RSS" | "API" | "OFFICIAL" | "PUBLISHER";

export type NewsSource = {
  id: string;
  name: string;
  source_type: NewsSourceType;
  endpoint: string;
  language_code?: string | null;
  country_code?: string | null;
  category_id?: string | null;
  config?: Record<string, unknown> | null;
  polling_interval_minutes?: number | null;
  consecutive_failures?: number | null;
  total_successes?: number | null;
  total_failures?: number | null;
  etag?: string | null;
  last_modified?: string | null;
};

export type NormalizedNewsItem = {
  externalId: string | null;
  title: string;
  description: string | null;
  url: string;
  canonicalUrl: string;
  publishedAt: string | null;
  author: string | null;
  languageCode: string | null;
  countryCode: string | null;
  sourceId: string;
  sourceName: string;
  normalizedHash: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type SourceFetchResult = {
  items: NormalizedNewsItem[];
  statusCode: number;
  etag: string | null;
  lastModified: string | null;
};

export interface NewsSourceAdapter {
  fetch(source: NewsSource): Promise<SourceFetchResult>;
  normalize(item: unknown, source: NewsSource): NormalizedNewsItem;
  validate(item: NormalizedNewsItem): ValidationResult;
}