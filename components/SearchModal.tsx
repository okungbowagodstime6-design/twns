"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { ArrowUpRight, CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

type SearchArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  country_code: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};
type CategoryFacet = { name: string; slug: string };
type CountryFacet = { code: string; name: string };
type SearchResponse = { articles: SearchArticle[]; categories: CategoryFacet[]; countries: CountryFacet[]; error: string | null };
type Props = { mode: "page" | "dialog"; initialQuery?: string; onClose?: () => void };

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently published" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default function SearchModal({ mode, initialQuery = "", onClose }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [articles, setArticles] = useState<SearchArticle[]>([]);
  const [categories, setCategories] = useState<CategoryFacet[]>([]);
  const [countries, setCountries] = useState<CountryFacet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDialog = mode === "dialog";

  useEffect(() => {
    if (!isDialog || !onClose) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDialog, onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (country) params.set("country", country);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      try {
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        const data = await response.json() as SearchResponse;
        setCategories(data.categories ?? []);
        setCountries(data.countries ?? []);
        if (!response.ok) throw new Error(data.error || "Search is temporarily unavailable.");
        setArticles(data.articles ?? []);
        setError(data.error || "");
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name !== "AbortError") setError(requestError.message || "Search is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, category, country, from, to]);

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose?.();
  }

  function clearFilters() {
    setCategory(""); setCountry(""); setFrom(""); setTo("");
  }

  const searchContent = <div className={`search-system ${isDialog ? "search-system-dialog" : "search-system-page"}`}>
    {isDialog ? <div className="search-dialog-top"><span><Search size={17} /> Quick search</span><button type="button" onClick={onClose} aria-label="Close search"><X size={19} /></button></div> : <div className="search-page-heading"><p className="section-kicker">TWNS ARCHIVE</p><h1>Search the world.</h1><p>Find reporting by headline, category, place, or topic.</p></div>}

    <label className="global-search-box"><Search size={20} /><span className="sr-only">Search headlines, categories, countries, and topics</span><input autoFocus={isDialog} value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Headlines, categories, countries, topics..." />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</label>

    <div className="search-filter-bar" aria-label="Search filters">
      <span className="search-filter-label"><SlidersHorizontal size={15} /> Filter</span>
      <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label><span>Country</span><select value={country} onChange={(event) => setCountry(event.target.value)}><option value="">All countries</option>{countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label><span>From</span><input aria-label="Published from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
      <label><span>To</span><input aria-label="Published to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      {(category || country || from || to) && <button className="search-clear-filters" type="button" onClick={clearFilters}>Clear filters</button>}
    </div>

    <div className="search-results-heading"><h2>{query.trim() ? "Search results" : "Latest stories"}</h2><span>{loading ? "Searching..." : `${articles.length} ${articles.length === 1 ? "story" : "stories"}`}</span></div>
    {error && <p className="search-error" role="alert">{error}</p>}
    <div className="global-search-results" aria-live="polite">
      {articles.map((article) => {
        return <Link className="global-search-result" href={`/article/${article.slug}`} key={article.id} onClick={onClose}>
          <div className="global-search-result-copy"><div className="global-search-meta"><span>{article.category || "World"}</span><span>{article.country_code || "Global"}</span><span><CalendarDays size={13} /> {formatDate(article.published_at)}</span></div><h3>{article.title}</h3><p>{article.summary || "Read the attributed report from the TWNS newsroom."}</p></div>
          <ArrowUpRight className="global-search-arrow" size={17} />
        </Link>;
      })}
      {!loading && !error && !articles.length && <p className="search-empty">No published stories match those terms and filters. Try a broader search.</p>}
    </div>
    {isDialog && query.trim() && <Link className="search-dialog-all" href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={onClose}>Open all search results <ArrowUpRight size={15} /></Link>}
  </div>;

  if (!isDialog) return searchContent;
  return <div className="search-dialog-backdrop" role="presentation" onMouseDown={handleBackdrop}><section className="search-dialog" role="dialog" aria-modal="true" aria-label="Global search">{searchContent}</section></div>;
}
