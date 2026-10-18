import type { MetadataRoute } from "next";
import { getPublishedArticlesForSitemap } from "@/lib/news/public";
import { getSiteUrl } from "@/lib/site-url";
import { ALL_COUNTRIES } from "@/lib/constants/countries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const articles = await getPublishedArticlesForSitemap();

  return [
    {
      url: new URL("/", siteUrl).toString(),
      priority: 1.0
    },
    ...ALL_COUNTRIES.map((country) => ({
      url: new URL(`/country/${country.code.toLowerCase()}`, siteUrl).toString(),
      changeFrequency: "daily" as const,
      priority: 0.5
    })),
    {
      url: new URL("/countries", siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.6
    },
    ...articles.map((article) => ({
      url: new URL(`/news/${encodeURIComponent(article.slug)}`, siteUrl).toString(),
      lastModified: article.published_at ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.8
    }))
  ];
}