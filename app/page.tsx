import React from 'react';
import { getPublishedArticles, type PublicArticle } from '../lib/news/public';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import TWNSHeader from '../components/TWNSHeader';
import HeroArticle from '../components/HeroArticle';
import StoryGrid from '../components/StoryGrid';


export type Article = PublicArticle;


export default async function HomePage() {
  let articles: Article[] = [];
  let error: string | null = null;

  try {
    articles = await getPublishedArticles({ limit: 20 });
  } catch (err) {
    error = (err as Error)?.message || 'Unknown error fetching articles';
  }

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <>
      <TWNSHeader />
      {error ? (
        <div role="alert" className="error-message">
          <h2>Error loading articles</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {heroArticle ? (
            <HeroArticle article={heroArticle} />
          ) : (
            <section className="hero-section">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className="live-dot" /> LIVE GLOBAL DESK
                </p>
                <h1>
                  The world is moving.
                  <br />
                  <em>Stay in the know.</em>
                </h1>
                <p className="hero-description">
                  The World&apos;s News. Personalized for You. Follow the stories shaping your country, your interests, and the world around you.
                </p>
                <div className="hero-actions">
                  <Link href="/onboarding" className="button button-light">
                    Personalize my feed <ArrowUpRight size={17} />
                  </Link>
                  <Link href="/world" className="button button-outline">
                    Explore the newsroom
                  </Link>
                </div>
              </div>
            </section>
          )}
          <section className="content-shell">
            <div className="section-heading">
              <div>
                <p className="section-kicker">YOUR DAILY BRIEF</p>
                <h2>What&apos;s happening now</h2>
              </div>
              <Link href="/world" className="text-link">
                View all stories <ArrowUpRight size={16} />
              </Link>
            </div>
            <StoryGrid articles={gridArticles} />
          </section>
        </>
      )}
    </>
  );
}

