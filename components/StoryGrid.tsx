import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { PublicArticle } from "../lib/news/public";
import AdSlot from "./AdSlot";

function categoryClass(article: PublicArticle) {
  const category = (article.category_slug || article.main_category || article.category || "world")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return `story-category story-category-${category}`;
}

function publishedLabel(value: string | null): string {
  if (!value) return "Recently published";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently published"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function ArticleMeta({ article }: { article: PublicArticle }) {
  return (
    <div className="story-meta">
      <span><MapPin size={14} aria-hidden="true" /> {article.country_code || "Global"}</span>
      <span><Clock3 size={14} aria-hidden="true" /> {publishedLabel(article.published_at)}</span>
      {article.source_name && <span className="story-meta-source">{article.source_name}</span>}
    </div>
  );
}

function StoryBadge({ article }: { article: PublicArticle }) {
  const label = article.category || article.article_type || "World";
  return <span className={categoryClass(article)}>{label}</span>;
}

export default function StoryGrid({ articles }: { articles: PublicArticle[] }) {
  if (!articles.length) return null;

  const [lead, ...rest] = articles;
  const secondary = rest.slice(0, 3);
  const latest = rest.slice(3, 8);
  const remaining = rest.slice(8);

  return (
    <div className="story-grid">
      <Link href={`/article/${lead.slug}`} className="story-card story-card-lead">
        <div className="story-topline">
          <StoryBadge article={lead} />
          <span className="story-edition-label">LEAD STORY</span>
        </div>
        <h2>{lead.title}</h2>
        <p className="story-summary">{lead.summary || "Read the attributed report from the TWNS newsroom."}</p>
        <ArticleMeta article={lead} />
        <span className="story-read-link">Read the full report <ArrowUpRight size={15} aria-hidden="true" /></span>
      </Link>

      {secondary.length > 0 && (
        <section className="story-secondary" aria-label="More headlines">
          <div className="story-column-heading">
            <span className="section-kicker">THE LATEST</span>
            <span>{String(secondary.length).padStart(2, "0")} STORIES</span>
          </div>
          {secondary.map((article, index) => (
            <Link href={`/article/${article.slug}`} className="story-card story-card-secondary" key={article.id}>
              <div className="story-topline">
                <StoryBadge article={article} />
                <span className="story-number">{String(index + 2).padStart(2, "0")}</span>
              </div>
              <h3>{article.title}</h3>
              <p className="story-summary">{article.summary || "Read the attributed report from the TWNS newsroom."}</p>
              <ArticleMeta article={article} />
            </Link>
          ))}
        </section>
      )}

      <aside className="story-trending" aria-label="Latest headlines and advertisement">
        {latest.length > 0 && (
          <>
          <div className="story-column-heading">
            <span className="section-kicker">IN BRIEF</span>
            <span>RECENT REPORTS</span>
          </div>
          <ol>
            {latest.map((article, index) => (
              <li key={article.id}>
                <span className="story-trending-number">{String(index + 5).padStart(2, "0")}</span>
                <Link href={`/article/${article.slug}`}>
                  <StoryBadge article={article} />
                  <h3>{article.title}</h3>
                  <span className="story-trending-date">{publishedLabel(article.published_at)}</span>
                </Link>
              </li>
            ))}
          </ol>
          </>
        )}
        <AdSlot slotType="sidebar" slotId={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT} sidebarHeight={600} className="story-sidebar-ad" />
      </aside>

      {remaining.length > 0 && (
        <section className="story-more-grid" aria-label="More published stories">
          <div className="story-column-heading">
            <span className="section-kicker">MORE COVERAGE</span>
            <span>{remaining.length} STORIES</span>
          </div>
          <div className="story-more-cards">
            {remaining.map((article, index) => (
              <Link href={`/article/${article.slug}`} className="story-card story-card-secondary" key={article.id}>
                <div className="story-topline">
                  <StoryBadge article={article} />
                  <span className="story-number">{String(index + 9).padStart(2, "0")}</span>
                </div>
                <h3>{article.title}</h3>
                <p className="story-summary">{article.summary || "Read the attributed report from the TWNS newsroom."}</p>
                <ArticleMeta article={article} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
