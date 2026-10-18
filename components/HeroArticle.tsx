import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";

function publishedLabel(value: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently published"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default function HeroArticle({ article }: { article: PublicArticle | null }) {
  if (!article) return null;

  const category = article.category || article.article_type || "World";
  const categorySlug = (article.category_slug || article.main_category || category)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  return (
    <section className="hero-section hero-section-typographic">
      <div className="hero-copy">
        <div className="hero-topline">
          <span className={`story-category story-category-${categorySlug}`}>{category}</span>
          <span className="hero-edition-label">TWNS · LEAD REPORT</span>
        </div>
        <h1>{article.title}</h1>
        <p className="hero-description">
          {article.summary || "Top story currently trending. Read the attributed report from the TWNS newsroom."}
        </p>
        <div className="hero-article-meta">
          <span>{article.source_name || `${category} News`}</span>
          <span><Clock3 size={14} aria-hidden="true" /> {publishedLabel(article.published_at)}</span>
        </div>
        <div className="hero-actions">
          <Link href={`/article/${article.slug}`} className="button button-light" aria-label={`Read ${article.title}`}>
            Read the full report <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
