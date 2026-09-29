import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, BookOpen, Globe2, Heart, Settings2, ShieldCheck, UserRound } from "lucide-react";

export type FoundationCard = {
  label: string;
  title: string;
  summary: string;
  icon?: LucideIcon;
};

export const foundationCards: Record<string, FoundationCard[]> = {
  "my-country": [
    { label: "COUNTRY DESK", title: "Nigeria, in focus", summary: "Your selected country is ready for personalization. No stories are available yet.", icon: Globe2 },
    { label: "LATEST", title: "No stories available yet", summary: "Connect a newsroom source to begin filling this desk with local reporting.", icon: BookOpen },
    { label: "CATEGORIES", title: "Choose your local signal", summary: "Follow public interest, business, technology, sport, or culture from your country.", icon: Settings2 }
  ],
  world: [
    { label: "GLOBAL DESK", title: "No global stories available yet", summary: "This foundation is ready for world and regional coverage when database content is connected.", icon: Globe2 },
    { label: "REGIONS", title: "Explore by region", summary: "Africa, the Americas, Asia-Pacific, Europe, and the Middle East will appear here.", icon: ArrowUpRight },
    { label: "LATEST", title: "Stay close to the signal", summary: "No demo articles are shown as real news. Add verified sources to populate this desk.", icon: BookOpen }
  ],
  breaking: [
    { label: "BREAKING DESK", title: "No breaking stories available", summary: "There are no verified developing stories in the connected newsroom yet.", icon: ShieldCheck },
    { label: "DEVELOPING", title: "Nothing developing right now", summary: "This space will clearly label live updates once trusted newsroom data is available.", icon: ArrowUpRight },
    { label: "ALERTS", title: "Follow breaking updates", summary: "Notification preferences can be configured from your settings page.", icon: Settings2 }
  ],
  business: [
    { label: "BUSINESS DESK", title: "No business stories available yet", summary: "Connect verified business coverage to populate this desk.", icon: BookOpen },
    { label: "MARKETS", title: "Markets and economy", summary: "A future category for carefully sourced market and economic reporting.", icon: ArrowUpRight },
    { label: "ENTERPRISE", title: "Companies and founders", summary: "Follow verified reporting on companies, work, and entrepreneurship.", icon: Globe2 }
  ],
  tech: [
    { label: "TECH DESK", title: "No technology stories available yet", summary: "This desk is ready for verified technology reporting and analysis.", icon: Globe2 },
    { label: "INNOVATION", title: "Ideas in motion", summary: "A future space for clearly sourced innovation and research coverage.", icon: ArrowUpRight },
    { label: "DIGITAL LIFE", title: "Technology that affects you", summary: "No demo articles are presented as real reporting.", icon: BookOpen }
  ],
  sports: [
    { label: "SPORTS DESK", title: "No sports stories available yet", summary: "Connect a verified sports source to populate this desk.", icon: Heart },
    { label: "FIXTURES", title: "Your next fixtures", summary: "A future home for schedules and results from supported competitions.", icon: ArrowUpRight },
    { label: "PEOPLE", title: "Athletes and communities", summary: "Follow sourced reporting beyond the scoreboard.", icon: Globe2 }
  ],
  entertainment: [
    { label: "CULTURE DESK", title: "No entertainment stories available yet", summary: "This desk is ready for verified culture and entertainment coverage.", icon: BookOpen },
    { label: "CULTURE", title: "What people are making", summary: "A future space for film, music, books, art, and cultural reporting.", icon: Globe2 },
    { label: "SPOTLIGHT", title: "Stories with context", summary: "No placeholder content is presented as real entertainment news.", icon: ArrowUpRight }
  ],
  more: [
    { label: "MORE FROM TWNS", title: "Find your next desk", summary: "Search, save stories, manage your profile, and tune your newsroom settings.", icon: ArrowUpRight },
    { label: "SAVED", title: "Keep stories close", summary: "Saved articles will appear here once you bookmark verified coverage.", icon: Heart },
    { label: "PROFILE", title: "Make the world more relevant", summary: "Set a country and interests to shape your personal signal.", icon: UserRound }
  ]
};

export const foundationTitles: Record<string, { kicker: string; title: string; summary: string }> = {
  "my-country": { kicker: "YOUR COUNTRY", title: "My country", summary: "Local stories, public-interest updates, and reporting with the context you need." },
  world: { kicker: "GLOBAL DESK", title: "World", summary: "Major global stories, regional context, and a clear view of what is moving." },
  breaking: { kicker: "LIVE DESK", title: "Breaking news", summary: "Developing coverage will appear here only when verified newsroom data is available." },
  business: { kicker: "BUSINESS DESK", title: "Business", summary: "Markets, companies, work, and the economic decisions shaping everyday life." },
  tech: { kicker: "TECH DESK", title: "Technology", summary: "Technology, research, and digital life covered with useful context." },
  sports: { kicker: "SPORTS DESK", title: "Sports", summary: "Fixtures, people, and sporting stories from around the world." },
  entertainment: { kicker: "CULTURE DESK", title: "Entertainment", summary: "Film, music, books, art, and the culture people are making." },
  more: { kicker: "TWNS NEWSROOM", title: "More from TWNS", summary: "The rest of your newsroom tools, organized in one place." }
};
