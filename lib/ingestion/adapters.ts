import { GenericApiSourceAdapter } from "./generic-api";
import { RssSourceAdapter } from "./rss";
import type { NewsSourceAdapter, NewsSource } from "./types";

export function adapterForSource(source: NewsSource): NewsSourceAdapter {
  if (source.source_type === "RSS" || source.source_type === "OFFICIAL" || source.source_type === "PUBLISHER") {
    return new RssSourceAdapter();
  }
  if (source.source_type === "API") return new GenericApiSourceAdapter();
  throw new Error(`Unsupported source type: ${source.source_type}`);
}