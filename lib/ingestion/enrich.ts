import { Article } from './adapters';

export function enrichMetadata(article: Partial<Article>): Article {
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
  
  return article as Article;
}
