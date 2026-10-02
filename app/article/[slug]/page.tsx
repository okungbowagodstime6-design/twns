import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Newspaper } from "lucide-react";
import TWNSHeader from "../../../components/TWNSHeader";
import { getPublishedArticle } from "../../../lib/news/public";

export const revalidate = 60;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  if (!value) return "Recently published";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDatetime(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

function relativeTime(value: string | null): string {
  if (!value) return "";
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
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Story not found | TWNS" };
  return {
    title: `${article.title} | TWNS`,
    description: article.summary ?? "Read the full report on The World News Station.",
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);

  if (!article) notFound();

  const readTime = readingTime(article.content ?? article.summary);
  const relative = relativeTime(article.published_at);

  return (
    <main>
      <TWNSHeader />

      {/* ── Breadcrumb ── */}
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
        {/* ── Header ── */}
        <header className="article-header">
          <p className="section-kicker">
            {article.article_type === "BREAKING" && (
              <span className="live-dot" aria-hidden="true" />
            )}
            {article.category ?? article.article_type ?? "WORLD"}
          </p>

          <h1 className="article-title">{article.title}</h1>

          {article.summary && (
            <p className="article-lede">{article.summary}</p>
          )}

          <div className="article-byline">
            <div className="byline-meta">
              {article.country_code && (
                <span>
                  <MapPin size={13} aria-hidden="true" />
                  {article.country_code}
                </span>
              )}
              {article.published_at && (
                <time
                  dateTime={formatDatetime(article.published_at)}
                  title={formatDate(article.published_at)}
                >
                  <Clock3 size={13} aria-hidden="true" />
                  {relative || formatDate(article.published_at)}
                </time>
              )}
              {readTime && (
                <span className="byline-readtime">{readTime}</span>
              )}
            </div>

            <div className="byline-source">
              <Newspaper size={13} aria-hidden="true" />
              {article.source_name ? `SOURCE: ${article.source_name}` : "TWNS NEWSROOM"}
            </div>
          </div>
        </header>

        {/* ── Rule ── */}
        <div className="article-rule" aria-hidden="true" />

        {/* ── Body ── */}
        <section className="article-body">
          {(article.content || article.summary) ? (
            (article.content ?? article.summary)!
              .split(/\n{2,}/)
              .map((para, i) => (
                <p key={i}>{para.trim()}</p>
              ))
          ) : (
            <p className="article-placeholder">
              No additional content is available for this report.
            </p>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="article-footer">
          <div className="article-attribution">
            <p className="section-kicker">Attribution</p>
            <p>
              This report is attributed to{" "}
              <strong>{article.source_name ?? "the TWNS newsroom"}</strong>
              {article.published_at && `, published ${formatDate(article.published_at)}`}.
            </p>
            {article.original_url && (
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="article-source-link"
              >
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
