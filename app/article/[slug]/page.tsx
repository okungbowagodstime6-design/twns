import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, MapPin } from "lucide-react";
import TWNSHeader from "../../../components/TWNSHeader";
import { getPublishedArticle } from "../../../lib/news/public";

export const revalidate = 60;

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  return (
    <main>
      <TWNSHeader />
      <article className="article-page">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        {article ? (
          <>
            <p className="section-kicker">{article.category || article.article_type || "WORLD"}</p>
            <h1>{article.title}</h1>
            <p className="article-lede">{article.summary || "Attributed reporting from the TWNS newsroom."}</p>
            <div className="story-meta">
              <span><MapPin size={14} /> {article.country_code || "Global"}</span>
              <span><Clock3 size={14} /> {article.published_at ? new Date(article.published_at).toLocaleString() : "Recently published"}</span>
            </div>
            <div className="article-body">
              <p>{article.content || article.summary || "No additional content is available for this report."}</p>
  
            </div>
            <div className="article-source">
                          <strong>Source: TWNS Editorial Board</strong>
                          
                        </div>
          </>
        ) : (
          <>
            <p className="section-kicker">NOT FOUND</p>
            <h1>Story unavailable</h1>
            <p className="article-lede">This published story is no longer available.</p>
          </>
        )}
      </article>
    </main>
  );
}
