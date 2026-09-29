import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, MapPin } from "lucide-react";
import TWNSHeader from "../../components/TWNSHeader";

const routeStories = [
  {
    category: "WORLD",
    headline: "The stories shaping the next 24 hours",
    summary: "A clear, concise briefing on the decisions, markets, and people moving the world forward.",
    country: "Global",
    time: "Updated today"
  },
  {
    category: "LOCAL",
    headline: "Nigeria's public-interest desk",
    summary: "Local context and useful reporting for readers following the country closely.",
    country: "Nigeria",
    time: "Updated today"
  },
  {
    category: "SIGNAL",
    headline: "Find the coverage that fits you",
    summary: "Choose a topic and make your daily brief more relevant to the things you care about.",
    country: "For you",
    time: "Set preferences"
  }
];

function formatRouteTitle(slug: string[]) {
  return slug
    .join(" / ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function NewsroomRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = formatRouteTitle(slug);

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">TWNS NEWSROOM</p>
        <h1>{title}</h1>
        <p>Stay close to the reporting that matters, with context built for a faster read.</p>
      </section>

      <section className="content-shell route-content">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        <div className="story-grid">
          {routeStories.map((story) => (
            <article className="story-card" key={story.headline}>
              <div className="story-topline">
                <span className="story-category">{story.category}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </div>
              <h2>{story.headline}</h2>
              <p>{story.summary}</p>
              <div className="story-meta">
                <span><MapPin size={14} /> {story.country}</span>
                <span><Clock3 size={14} /> {story.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}