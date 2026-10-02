export type IngestionArticle = {
  title?: string;
  source_url?: string;
  category?: string;
  target_country?: string;
  importance_score?: number;
};

export function enrichMetadata(article: Partial<IngestionArticle>): IngestionArticle {
  // Assign default category
  if (!article.category) {
    article.category = 'General';
  }

  // Infer country
  if (!article.target_country) {
    if (article.category?.toLowerCase() === 'business') {
      article.target_country = 'US';
    } else {
      article.target_country = 'Global';
    }
  }

  // Assign importance score
  article.importance_score = article.importance_score ?? 50;
  
  return article as IngestionArticle;
}
