import { NextResponse } from 'next/server';
import { fetchRSSFeed, fetchJSONNewsAPI } from '@/lib/ingestion/adapters';
import { checkDuplicate } from '@/lib/ingestion/deduplicate';
import { enrichMetadata } from '@/lib/ingestion/enrich';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SOURCES = [
  { type: 'rss', url: 'https://example.com/feed.xml' },
  { type: 'json', url: 'https://example.com/api/news.json' },
];

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let ingestedCount = 0;
  let errors: string[] = [];

  for (const source of SOURCES) {
    try {
      let articles = [];
      if (source.type === 'rss') {
        articles = await fetchRSSFeed(source.url);
      } else if (source.type === 'json') {
        articles = await fetchJSONNewsAPI(source.url);
      }
      for (const articleRaw of articles) {
        const article = enrichMetadata(articleRaw);
        const isDuplicate = await checkDuplicate({ source_url: article.source_url, title: article.title });
        if (isDuplicate) continue;

        const { error } = await supabase.from('articles').insert(article);
        if (error) {
          errors.push(`Insert error for ${article.title}: ${error.message}`);
        } else {
          ingestedCount++;
        }
      }
    } catch (error: any) {
      errors.push(`Error processing source ${source.url}: ${error.message}`);
    }
  }

  return NextResponse.json({ success: true, ingestedCount, errors });
}
