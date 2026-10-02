import Link from "next/link";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import TWNSHeader from "@/components/TWNSHeader";
import StoryGrid from "@/components/StoryGrid";
import { getPublishedArticles } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const articles = query ? await getPublishedArticles({ search: query, limit: 20 }) : [];

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">NEWSROOM ARCHIVE</p>
        <h1>Search TWNS</h1>
        <p>Explore verified reporting, developing stories, and news desks across the globe.</p>
      </section>

      <section className="content-shell search-content">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} /> Back to the front page
        </Link>

        <form method="GET" action="/search" style={{ marginTop: "24px" }}>
          <div className="search-field">
            <SearchIcon size={20} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by topic, country, keyword..."
              autoFocus
            />
          </div>
        </form>

        {query ? (
          <div style={{ marginTop: "32px" }}>
            <p className="section-kicker">
              {articles.length} {articles.length === 1 ? "RESULT" : "RESULTS"} FOR &ldquo;{query}&rdquo;
            </p>
            {articles.length > 0 ? (
              <StoryGrid articles={articles} />
            ) : (
              <p className="empty-state" style={{ marginTop: "16px" }}>
                No published articles matched your search query.
              </p>
            )}
          </div>
        ) : (
          <p className="empty-state" style={{ marginTop: "24px" }}>
            Enter a keyword above to search through published newsroom stories.
          </p>
        )}
      </section>
    </main>
  );
}
