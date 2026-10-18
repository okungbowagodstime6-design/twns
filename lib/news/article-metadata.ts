import type { Metadata } from "next";
import type { PublicArticle } from "./public";
import { getSiteUrl } from "../site-url";

function getCoverImageUrl(article: PublicArticle, siteUrl: string): string | undefined {
  const metadata = article.metadata;
  const candidate = metadata
    ? [metadata.image_url, metadata.imageUrl, metadata.cover_image_url, metadata.featured_image_url, metadata.featured_image, metadata.thumbnail_url]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    : undefined;

  if (!candidate) return undefined;

  try {
    const imageUrl = new URL(candidate.trim(), siteUrl);
    return imageUrl.protocol === "https:" || imageUrl.protocol === "http:" ? imageUrl.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function createArticleMetadata(
  article: PublicArticle | null,
  slug: string,
  route: "news" | "article"
): Metadata {
  if (!article) return { title: "Story not found | TWNS" };

  const siteUrl = getSiteUrl();
  const title = article.title;
  const description = article.summary?.trim() || "Read the full report on The World News Station.";
  const url = new URL(`/${route}/${encodeURIComponent(slug)}`, siteUrl).toString();
  const image = getCoverImageUrl(article, siteUrl);
  const images = image ? [{ url: image, alt: title }] : undefined;

  return {
    title: `${title} | TWNS`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      publishedTime: article.published_at ?? undefined,
      images
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images
    }
  };
}
