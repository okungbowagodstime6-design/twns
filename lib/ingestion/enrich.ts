export type Article = {
  category?: string;
  target_country?: string;
  importance_score?: number;
  [key: string]: unknown;
};

export function enrichMetadata(article: Partial<Article>): Article {
  const category = article.category ?? "General";
  const targetCountry = article.target_country ?? (category.toLowerCase() === "business" ? "US" : "Global");
  return {
    ...article,
    category,
    target_country: targetCountry,
    importance_score: article.importance_score ?? 50
  };
}
