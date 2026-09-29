import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import type { PublicArticle } from "../lib/news/public";

function accentFor(article: PublicArticle): "red" | "blue" | "green" {
  if (article.article_type === "BREAKING" || article.article_type === "DEVELOPING") return "red";
  if (article.country_code === "NG") return "green";
  return "blue";
}

function publishedLabel(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Recently published";
}

export default function StoryGrid({ articles }: { articles: PublicArticle[] }) {
  return (
    <div className="story-grid">
      {articles.map((article, index) => (
        <Link href={`/article/${article.slug}`} className={`story-card story-card-${accentFor(article)}`} key={article.id}>
          <div className="story-topline">
            <span className="story-category">{article.category || article.article_type || "WORLD"}</span>
            <span className="story-number">0{index + 1}</span>
          </div>
          <h3>{article.title}</h3>
          <p>{article.summary || "Read the attributed report from the TWNS newsroom."}</p>
          <div className="story-meta">
            <span><MapPin size={14} /> {article.country_code || "Global"}</span>
            <span><Clock3 size={14} /> {publishedLabel(article.published_at)}</span>
          </div>
          <div className="story-source">TWNS NEWS</div>
        </Link>
      ))}
    </div>
  );
}
