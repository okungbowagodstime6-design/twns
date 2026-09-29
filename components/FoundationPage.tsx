import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import TWNSHeader from "./TWNSHeader";
import { foundationCards, foundationTitles } from "../lib/foundation";

export default function FoundationPage({ pageKey }: { pageKey: string }) {
  const page = foundationTitles[pageKey] ?? foundationTitles.more;
  const cards = foundationCards[pageKey] ?? foundationCards.more;

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
        <div className="foundation-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="foundation-panel" key={card.title}>
                <div className="foundation-panel-topline">
                  <span className="story-category">{card.label}</span>
                  {Icon && <Icon size={20} aria-hidden="true" />}
                </div>
                <h2>{card.title}</h2>
                <p>{card.summary}</p>
              </article>
            );
          })}
        </div>
        <div className="foundation-actions">
          <Link href="/personalize" className="button button-dark">Personalize my signal <ArrowUpRight size={17} /></Link>
          <Link href="/saved" className="text-link">Open saved stories <ArrowUpRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
