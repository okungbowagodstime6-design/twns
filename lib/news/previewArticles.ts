import type { Article } from "../../types/article";

export const illustrativeCategoryArtwork = {
  world: "https://images.unsplash.com/photo-1451187580459-43490279cfa2?auto=format&fit=crop&w=1600&q=80",
  business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  culture: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
};

export const previewArticles: Article[] = [
  {
    id: "preview-world-01",
    slug: "preview-world-desk",
    title: "Preview: World desk lead story",
    summary: "Sample editorial copy demonstrates the featured story layout. This is not live reporting.",
    content: null,
    original_url: null,
    source_name: "Preview only",
    author: null,
    country_code: "NG",
    language_code: "en",
    category: "WORLD",
    article_type: "STANDARD",
    published_at: null,
    metadata: { image_url: illustrativeCategoryArtwork.world },
    is_preview: true
  },
  {
    id: "preview-business-02",
    slug: "preview-business-desk",
    title: "Preview: Business desk briefing",
    summary: "Sample copy for the business section. No event, source, or claim is represented as real.",
    content: null,
    original_url: null,
    source_name: "Preview only",
    author: null,
    country_code: "US",
    language_code: "en",
    category: "BUSINESS",
    article_type: "STANDARD",
    published_at: null,
    metadata: { image_url: illustrativeCategoryArtwork.business },
    is_preview: true
  },
  {
    id: "preview-technology-03",
    slug: "preview-technology-desk",
    title: "Preview: Technology desk story",
    summary: "Sample copy demonstrates a technology card. It is illustrative interface content only.",
    content: null,
    original_url: null,
    source_name: "Preview only",
    author: null,
    country_code: "GB",
    language_code: "en",
    category: "TECHNOLOGY",
    article_type: "STANDARD",
    published_at: null,
    metadata: { image_url: illustrativeCategoryArtwork.technology },
    is_preview: true
  },
  {
    id: "preview-science-04",
    slug: "preview-science-desk",
    title: "Preview: Science desk report",
    summary: "Sample copy for a science feature. It contains no factual reporting.",
    content: null,
    original_url: null,
    source_name: "Preview only",
    author: null,
    country_code: "KE",
    language_code: "en",
    category: "SCIENCE",
    article_type: "STANDARD",
    published_at: null,
    metadata: { image_url: illustrativeCategoryArtwork.science },
    is_preview: true
  },
  {
    id: "preview-culture-05",
    slug: "preview-culture-desk",
    title: "Preview: Culture desk feature",
    summary: "Sample copy demonstrates the culture grid. It is not a published story.",
    content: null,
    original_url: null,
    source_name: "Preview only",
    author: null,
    country_code: "GH",
    language_code: "en",
    category: "ENTERTAINMENT",
    article_type: "STANDARD",
    published_at: null,
    metadata: { image_url: illustrativeCategoryArtwork.culture },
    is_preview: true
  }
];
