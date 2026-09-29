import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import TWNSHeader from "./TWNSHeader";
import StoryGrid from "./StoryGrid";
import { foundationTitles } from "../lib/foundation";
import { getPublishedArticles, type PublishedArticleQuery } from "../lib/news/public";

export default async function NewsDeskPage({
  pageKey,
  query,
  emptyTitle,
  emptySummary
}: {
  pageKey: string;
  query?: PublishedArticleQuery;
  emptyTitle?: string;
  emptySummary?: string;
}) {
  const page = foundationTitles[pageKey] ?? foundationTitles.more;
  const articles = await getPublishedArticles({ limit: 24, ...query });

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">{page.kicker}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </section>
      <section className="content-shell route-content">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        {articles.length ? (
          <StoryGrid articles={articles} />
        ) : (
          <div className="empty-state-panel">
            <BookOpen size={32} />
            <h2>{emptyTitle || "No verified stories on this desk yet."}</h2>
            <p>{emptySummary || "Published, attributed reporting will appear here after editorial review."}</p>
            <Link href="/" className="button button-dark">Back to the front page</Link>
          </div>
        )}
      </section>
    </main>
  );
}
