import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import TWNSHeader from "../../../components/TWNSHeader";
import StoryGrid from "../../../components/StoryGrid";
import { getPublishedArticles } from "../../../lib/news/public";

export const revalidate = 60;

const countryNames: Record<string, { code: string; name: string }> = {
  ng: { code: "NG", name: "Nigeria" },
  nigeria: { code: "NG", name: "Nigeria" },
  gh: { code: "GH", name: "Ghana" },
  ke: { code: "KE", name: "Kenya" },
  za: { code: "ZA", name: "South Africa" },
  us: { code: "US", name: "United States" },
  gb: { code: "GB", name: "United Kingdom" }
};

function countryFromSlug(countrySlug: string) {
  const mapped = countryNames[countrySlug.toLowerCase()];
  if (mapped) return mapped;
  const code = countrySlug.length === 2 ? countrySlug.toUpperCase() : countrySlug.replace(/-/g, " ").toUpperCase();
  const name = countrySlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { code, name };
}

export default async function CountryPage({ params }: { params: { countrySlug: string } }) {
  const country = countryFromSlug(params.countrySlug);
  const articles = await getPublishedArticles({ countryCode: country.code, limit: 24 });

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">COUNTRY DESK</p>
        <h1>{country.name}, in focus.</h1>
        <p>Local stories, public-interest updates, and reporting with the context you need.</p>
      </section>
      <section className="content-shell route-content">
        <Link href="/my-country" className="text-link"><ArrowLeft size={16} /> Back to my country</Link>
        {articles.length ? (
          <StoryGrid articles={articles} />
        ) : (
          <div className="empty-state-panel">
            <BookOpen size={32} />
            <h2>No local stories available yet.</h2>
            <p>Verified country reporting will appear here when published coverage is attributed to {country.name}.</p>
          </div>
        )}
      </section>
    </main>
  );
}
