import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Newspaper } from "lucide-react";
import ShareButtons from "../../../components/ShareButtons";
import { createArticleMetadata } from "../../../lib/news/article-metadata";
import { getPublishedArticle, getPublishedArticles } from "../../../lib/news/public";
import { getSiteUrl } from "../../../lib/site-url";
import AdSlot from "../../../components/AdSlot";
import StoryGrid from "../../../components/StoryGrid";

export const revalidate = 60;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently published";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDatetime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function relativeTime(value: string | null): string {
  if (!value) return "";
  const publishedAt = new Date(value).getTime();
  if (Number.isNaN(publishedAt)) return "";
  const diffMs = Date.now() - publishedAt;
  const future = diffMs < 0;
  const mins = Math.floor(Math.abs(diffMs) / 60_000);
  if (mins < 1) return future ? "Soon" : "Just now";
  if (mins < 60) return `${future ? "in " : ""}${mins}m${future ? "" : " ago"}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${future ? "in " : ""}${hrs}h${future ? "" : " ago"}`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${future ? "in " : ""}${days}d${future ? "" : " ago"}`;
  return formatDate(value);
}

function readingTime(text: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/).length;
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
  return createArticleMetadata(await getPublishedArticle(slug), slug, "article");
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
  const relatedCandidates = await getPublishedArticles({
    ...(article.category_slug ? { categorySlug: article.category_slug } : {}),
    limit: 8
  });
  const relatedArticles = relatedCandidates.filter((candidate) => candidate.id !== article.id).slice(0, 4);

  const body = article.content?.trim() || article.summary?.trim() || "";
  const readTime = readingTime(body);
  const relative = relativeTime(article.published_at);
  const paragraphs = body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const shareUrl = new URL(`/article/${encodeURIComponent(slug)}`, getSiteUrl()).toString();

  return (
    <main>

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
            <span className={`story-category story-category-${(article.category_slug || article.main_category || article.category || "world").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`}>
              {article.category ?? article.article_type ?? "WORLD"}
            </span>
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
                  dateTime={formatDatetime(article.published_at) || undefined}
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
          <ShareButtons title={article.title} url={shareUrl} />
        </header>

        {/* ── Rule ── */}
        <div className="article-rule" aria-hidden="true" />

        {/* ── Body ── */}
        <section className="article-body">
          {paragraphs.length ? (
            paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
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
      <div className="article-ad-wrap">
        <AdSlot slotType="inFeed" slotId={process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT} />
      </div>
      {relatedArticles.length > 0 && (
        <section className="content-shell article-related">
          <div className="section-heading">
            <div>
              <p className="section-kicker">CONTINUE READING</p>
              <h2>Related reports</h2>
            </div>
          </div>
          <StoryGrid articles={relatedArticles} />
        </section>
      )}
    </main>
  );
}
