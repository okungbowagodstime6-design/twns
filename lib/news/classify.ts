export const DEFAULT_COUNTRY_CODE = "NG";

const categoryRules: Array<{ slug: string; terms: string[] }> = [
  { slug: "technology", terms: ["technology", "tech ", " ai ", "artificial intelligence", "software", "startup", "digital", "cyber", "chip", "semiconductor"] },
  { slug: "sports", terms: ["sport", "football", "soccer", "nba", "nfl", "cricket", "tennis", "olympic", "premier league", "world cup", "match"] },
  { slug: "entertainment", terms: ["film", "movie", "music", "hollywood", "nollywood", "celebrity", "festival", "album", "actor", "actress"] },
  { slug: "business", terms: ["market", "bank", "economy", "inflation", "shares", "stock", "company", "business", "trade", "interest rate"] }
];

const countryRules: Array<{ code: string; terms: string[] }> = [
  { code: "NG", terms: ["nigeria", "lagos", "abuja", "kano"] },
  { code: "US", terms: ["united states", "washington", "wall street", "white house"] },
  { code: "GB", terms: ["britain", "united kingdom", "london", "downing street"] },
  { code: "KE", terms: ["kenya", "nairobi"] },
  { code: "ZA", terms: ["south africa", "johannesburg", "cape town"] },
  { code: "GH", terms: ["ghana", "accra"] }
];

function haystack(parts: Array<string | null | undefined>): string {
  return ` ${parts.filter(Boolean).join(" ").toLowerCase()} `;
}

export function inferCategorySlug(...parts: Array<string | null | undefined>): string {
  const text = haystack(parts);
  const match = categoryRules.find((rule) => rule.terms.some((term) => text.includes(term)));
  return match?.slug ?? "world";
}

export function inferCountryCode(fallback: string | null | undefined, ...parts: Array<string | null | undefined>): string | null {
  if (fallback) return fallback;
  const text = haystack(parts);
  return countryRules.find((rule) => rule.terms.some((term) => text.includes(term)))?.code ?? null;
}

export function inferArticleType(...parts: Array<string | null | undefined>): "BREAKING" | "DEVELOPING" | "STANDARD" {
  const text = haystack(parts);
  if (text.includes("breaking")) return "BREAKING";
  if (text.includes("developing") || text.includes("live update")) return "DEVELOPING";
  return "STANDARD";
}

export function resolveCategorySlug(slug: string): string {
  const aliases: Record<string, string> = {
    tech: "technology",
    culture: "entertainment",
    "breaking-news": "breaking",
    "world-news": "world"
  };
  return aliases[slug] ?? slug;
}
