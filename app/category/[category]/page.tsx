import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import TWNSHeader from "../../../components/TWNSHeader";
import StoryGrid from "../../../components/StoryGrid";
import { getPublishedArticles } from "../../../lib/news/public";
import { resolveCategorySlug } from "../../../lib/news/classify";

export const revalidate = 60;

function titleFromSlug(category: string) {
  return resolveCategorySlug(category).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const title = titleFromSlug(category);
  const articles = await getPublishedArticles({ categorySlug: category, limit: 24 });

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">CATEGORY DESK</p>
        <h1>{title}</h1>
        <p>Reporting, analysis, and useful context from the TWNS newsroom.</p>
      </section>
      <section className="content-shell route-content">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        {articles.length ? (
          <StoryGrid articles={articles} />
        ) : (
          <div className="empty-state-panel">
            <BookOpen size={32} />
            <h2>No published stories in {title} yet.</h2>
            <p>This desk stays empty until attributed reporting is reviewed and published.</p>
          </div>
        )}
      </section>
    </main>
  );
}
