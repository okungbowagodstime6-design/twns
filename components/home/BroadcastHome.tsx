"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "../../lib/useLanguage";
import { browserSupabase } from "../../lib/supabase/browser";
import type { PublicArticle } from "../../lib/news/public";
import { previewArticles } from "../../lib/news/previewArticles";

type BroadcastArticle = Omit<PublicArticle, "category_slug"> & {
  category_slug?: string | null;
  language_code?: string | null;
  is_preview?: boolean;
};

type RegionalArticleRow = Omit<BroadcastArticle, "category" | "category_slug"> & {
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function storedCountryCode() {
  try {
    return window.localStorage.getItem("twns_country")?.toUpperCase() || "NG";
  } catch {
    return "NG";
  }
}

function publishTime(article: BroadcastArticle) {
  if (!article.published_at) return "Recently published";
  const date = new Date(article.published_at);
  return Number.isNaN(date.getTime()) ? "Recently published" : `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function categoryClass(article: BroadcastArticle) {
  const category = (article.category_slug || article.main_category || article.category || "world")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return `story-category story-category-${category}`;
}

async function getRegionalArticles(countryCode: string, languageCode: string): Promise<BroadcastArticle[]> {
  if (!browserSupabase) return [];
  const { data, error } = await browserSupabase
    .from("news_articles")
    .select("id, slug, title, summary, content, original_url, source_name, country_code, language_code, article_type, main_category, sub_category, published_at, metadata, categories(name, slug)")
    .eq("status", "PUBLISHED")
    .eq("country_code", countryCode)
    .eq("language_code", languageCode)
    .order("published_at", { ascending: false })
    .limit(12);
  if (error) {
    console.error("Failed to load regional articles:", error);
    return [];
  }
  if (!data) return [];

  return data.map((row: RegionalArticleRow): BroadcastArticle => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      content: row.content,
      source_name: row.source_name,
      original_url: row.original_url,
      country_code: row.country_code,
      category: category?.name ?? null,
      category_slug: category?.slug ?? null,
      main_category: row.main_category,
      sub_category: row.sub_category,
      article_type: row.article_type,
      published_at: row.published_at,
      metadata: row.metadata,
      language_code: row.language_code
    };
  });
}

function ArticleTarget({ article, className, children }: { article: BroadcastArticle; className: string; children: ReactNode }) {
  if (article.is_preview) return <article className={className}>{children}</article>;
  return <Link href={`/article/${article.slug}`} className={className}>{children}</Link>;
}

function PreviewFlag({ preview }: { preview?: boolean }) {
  return preview ? <span className="broadcast-preview-flag">Preview only</span> : null;
}

function StoryMeta({ article }: { article: BroadcastArticle }) {
  return <div className="broadcast-story-meta">
    <span><MapPin size={13} /> {article.country_code || "Global"}</span>
    <span><Clock3 size={13} /> {publishTime(article)}</span>
    <span>{article.source_name || "TWNS Newsroom"}</span>
  </div>;
}

function StoryTile({ article, index }: { article: BroadcastArticle; index: number }) {
  return <ArticleTarget article={article} className="broadcast-tile">
    <div className="broadcast-tile-copy">
      <div className="broadcast-card-kicker"><span className={categoryClass(article)}>{article.category || "WORLD"}</span><PreviewFlag preview={article.is_preview} /></div>
      <h3>{article.title}</h3>
      <p>{article.summary || "Read the attributed report from the TWNS newsroom."}</p>
      <StoryMeta article={article} />
      <span className="broadcast-index">{String(index + 1).padStart(2, "0")}</span>
    </div>
  </ArticleTarget>;
}

function CategorySection({ title, slug, articles }: { title: string; slug: string; articles: BroadcastArticle[] }) {
  const matches = articles.filter((article) => article.category?.toLowerCase() === slug);
  return <section className="broadcast-category-section">
    <div className="broadcast-section-heading">
      <div><p className="broadcast-eyebrow">THE NEWSROOM</p><h2>{title}</h2></div>
      <Link href={`/category/${slug}`} className="broadcast-more">More {title} <ArrowUpRight size={15} /></Link>
    </div>
    {matches.length ? <div className="broadcast-category-grid">{matches.slice(0, 3).map((article, index) => <StoryTile article={article} index={index} key={article.id} />)}</div> : <p className="broadcast-empty">No published {title.toLowerCase()} stories yet. This desk will populate when relevant coverage is reviewed.</p>}
  </section>;
}

export default function BroadcastHome({ initialArticles }: { initialArticles: PublicArticle[] }) {
  const language = useLanguage();
  const [countryCode, setCountryCode] = useState("NG");
  const [regionalArticles, setRegionalArticles] = useState<BroadcastArticle[]>([]);
  const [loadingRegional, setLoadingRegional] = useState(true);
  const previewMode = initialArticles.length === 0;
  const articles: BroadcastArticle[] = previewMode ? previewArticles : initialArticles;
  const featured = articles[0];
  const topStories = articles.slice(1, 4);
  const breakingArticle = previewMode ? null : initialArticles.find((article) => ["BREAKING", "DEVELOPING"].includes(article.article_type?.toUpperCase() ?? ""));

  useEffect(() => {
    const updateCountry = () => setCountryCode(storedCountryCode());
    updateCountry();
    window.addEventListener("twns_country_changed", updateCountry);
    return () => window.removeEventListener("twns_country_changed", updateCountry);
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingRegional(true);
    getRegionalArticles(countryCode, language).then((results) => {
      if (!active) return;
      setRegionalArticles(results);
      setLoadingRegional(false);
    });
    return () => { active = false; };
  }, [countryCode, language]);

  const localStories = regionalArticles.length
    ? regionalArticles
    : previewMode
      ? previewArticles.filter((article) => article.country_code === countryCode && article.language_code === language)
      : [];
  const trending = [...articles].sort((left, right) => {
    const leftTime = left.published_at ? Date.parse(left.published_at) : 0;
    const rightTime = right.published_at ? Date.parse(right.published_at) : 0;
    return rightTime - leftTime;
  }).slice(0, 5);

  return <main className="broadcast-home">
    <div className="broadcast-ticker" role="status" aria-live="polite">
      <span className="broadcast-ticker-label"><span className="broadcast-alert-dot" /> Breaking News</span>
      {breakingArticle ? <Link href={`/article/${breakingArticle.slug}`}>{breakingArticle.title}</Link> : <span className="broadcast-ticker-empty">No high-priority breaking report at this time</span>}
    </div>

    {previewMode && <div className="broadcast-preview-notice"><strong>Preview layout</strong><span>Sample cards below are illustrative only, not current news reports.</span></div>}

    {featured ? <section className="broadcast-lead-grid" aria-label="Top stories">
      <ArticleTarget article={featured} className="broadcast-featured">
        <div className="broadcast-featured-copy">
          <div className="broadcast-card-kicker"><span className={categoryClass(featured)}>{featured.category || "WORLD"}</span><PreviewFlag preview={featured.is_preview} /></div>
          <h1>{featured.title}</h1>
          <p>{featured.summary || "Attributed reporting from the TWNS newsroom."}</p>
          <StoryMeta article={featured} />
        </div>
      </ArticleTarget>
      <div className="broadcast-top-stories">
        <div className="broadcast-section-heading compact"><div><p className="broadcast-eyebrow">EDITOR&apos;S DESK</p><h2>Top stories</h2></div></div>
        {topStories.map((article, index) => <StoryTile article={article} index={index + 1} key={article.id} />)}
      </div>
    </section> : null}

    <section className="broadcast-content-grid">
      <div className="broadcast-main-column">
        <section className="broadcast-regional-section">
          <div className="broadcast-section-heading"><div><p className="broadcast-eyebrow">YOUR EDITION · {countryCode} · {language.toUpperCase()}</p><h2>Regional &amp; local</h2></div></div>
          {loadingRegional ? <p className="broadcast-empty">Loading stories for your edition…</p> : localStories.length ? <div className="broadcast-category-grid">{localStories.slice(0, 3).map((article, index) => <StoryTile article={article} index={index} key={article.id} />)}</div> : <p className="broadcast-empty">No published articles currently match this country and language. Change your edition above or check back as coverage is added.</p>}
        </section>

        <CategorySection title="Technology" slug="technology" articles={articles} />
        <CategorySection title="Health" slug="health" articles={articles} />
        <CategorySection title="Business" slug="business" articles={articles} />
        <CategorySection title="World" slug="world" articles={articles} />
      </div>

      <aside className="broadcast-trending" aria-labelledby="trending-title">
        <div className="broadcast-section-heading compact"><div><p className="broadcast-eyebrow">LATEST FIRST</p><h2 id="trending-title">Trending / most read</h2></div></div>
        <p className="broadcast-ranking-note">Ranked by publication recency; readership metrics are not yet connected.</p>
        <ol>{trending.map((article, index) => <li key={article.id}><span className="broadcast-rank">{index + 1}</span><ArticleTarget article={article} className="broadcast-trending-link"><span className={categoryClass(article)}>{article.category || "WORLD"}</span><strong>{article.title}</strong><PreviewFlag preview={article.is_preview} /></ArticleTarget></li>)}</ol>
      </aside>
    </section>
  </main>;
}
