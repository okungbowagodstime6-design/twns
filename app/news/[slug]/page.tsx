import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createArticleMetadata } from "../../../lib/news/article-metadata";
import { getPublishedArticle } from "../../../lib/news/public";

type NewsArticleParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: NewsArticleParams): Promise<Metadata> {
  const { slug } = await params;
  return createArticleMetadata(await getPublishedArticle(slug), slug, "news");
}

export default async function NewsArticleRedirect({ params }: NewsArticleParams) {
  const { slug } = await params;
  redirect(`/article/${encodeURIComponent(slug)}`);
}
