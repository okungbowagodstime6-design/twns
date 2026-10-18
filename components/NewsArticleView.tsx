import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Newspaper } from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";

function formatDate(value: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) return "Recently published";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatDatetime(value: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Date(value).toISOString();
}

function relativeTime(value: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

function readingTime(text: string | null): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function NewsArticleView({ article }: { article: PublicArticle }) {
  const readTime = readingTime(article.content ?? article.summary);
  const relative = relativeTime(article.published_at);
  const originalUrl = safeExternalUrl(article.original_url);

  return (
    <main>

      <div className="article-breadcrumb">
        <Link href="/" className="text-link">
          <ArrowLeft size={14} /> Front page
        </Link>
        {article.category && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-cat">{article.category}</span>
          </>
        )}
      </div>

      <article className="article-page">
        <header className="article-header">
          <p className="section-kicker">
            {article.article_type === "BREAKING" && <span className="live-dot" aria-hidden="true" />}
            {article.category ?? article.article_type ?? "WORLD"}
          </p>

          <h1 className="article-title">{article.title}</h1>
          {article.summary && <p className="article-lede">{article.summary}</p>}

          <div className="article-byline">
            <div className="byline-meta">
              {article.country_code && (
                <span>
                  <MapPin size={13} aria-hidden="true" />
                  {article.country_code}
                </span>
              )}
              {article.published_at && (
                <time dateTime={formatDatetime(article.published_at)} title={formatDate(article.published_at)}>
                  <Clock3 size={13} aria-hidden="true" />
                  {relative || formatDate(article.published_at)}
                </time>
              )}
              {readTime && <span className="byline-readtime">{readTime}</span>}
            </div>

            <div className="byline-source">
              <Newspaper size={13} aria-hidden="true" />
              SOURCE: {article.source_name || "TWNS News"}
            </div>
          </div>
        </header>

        <div className="article-rule" aria-hidden="true" />

        <section className="article-body">
          {(article.content || article.summary) ? (
            (article.content ?? article.summary)!
              .split(/\n{2,}/)
              .map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)
          ) : (
            <p className="article-placeholder">No additional content is available for this report.</p>
          )}
        </section>

        <footer className="article-footer">
          <div className="article-attribution">
            <p className="section-kicker">Attribution</p>
            <p>
              This report is attributed to <strong>{article.source_name || "TWNS News"}</strong>
              {article.published_at && `, published ${formatDate(article.published_at)}`}.
            </p>
            {originalUrl && (
              <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="article-source-link">
                Read original report <ExternalLink size={13} />
              </a>
            )}
          </div>

          <Link href="/" className="text-link article-back">
            <ArrowLeft size={14} /> Back to front page
          </Link>
        </footer>
      </article>
    </main>
  );
}