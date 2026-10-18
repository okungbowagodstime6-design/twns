import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import StoryGrid from "../../../components/StoryGrid";
import { getPublishedArticles } from "../../../lib/news/public";
import CountryNewsFilters from "../../../components/CountryNewsFilters";
import { ALL_COUNTRIES, getCountryByCode } from "../../../lib/constants/countries";

const topics = new Set(["politics", "economy", "crime_social", "government"]);

export default async function CountryPage({
  params,
  searchParams
}: {
  params: Promise<{ countrySlug: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const [{ countrySlug }, { topic }] = await Promise.all([params, searchParams]);
  const normalizedSlug = countrySlug.toLowerCase();
  const country = getCountryByCode(normalizedSlug)
    ?? ALL_COUNTRIES.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalizedSlug);
  if (!country) notFound();

  const selectedTopic = topic && topics.has(topic) ? topic : "";
  const articles = await getPublishedArticles({
    countryCode: country.code,
    ...(selectedTopic ? { subCategory: selectedTopic } : {}),
    limit: 24
  });

  return (
    <main>
      <section className="route-hero">
        <p className="section-kicker">COUNTRY DESK</p>
        <h1>{country.name}, in focus.</h1>
        <p>Local stories, public-interest updates, and reporting with the context you need.</p>
      </section>
      <section className="content-shell route-content">
        <Link href="/countries" className="text-link"><ArrowLeft size={16} /> Browse all countries</Link>
        <CountryNewsFilters countrySlug={country.code.toLowerCase()} selectedTopic={selectedTopic} />
        {articles.length ? (
          <StoryGrid articles={articles} />
        ) : (
          <div className="empty-state-panel">
            <BookOpen size={32} />
            <h2>No {selectedTopic ? `${selectedTopic.replace("_", " ")} ` : ""}stories available yet.</h2>
            <p>Verified country reporting will appear here when published coverage is attributed to {country.name}.</p>
          </div>
        )}
      </section>
    </main>
  );
}
