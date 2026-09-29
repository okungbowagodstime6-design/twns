import { NextResponse } from 'next/server';

// Updated Supabase client with fallback keys
// Supabase client with fallback service role or anon key
const supabase: any = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val._ && typeof val._ === 'string') return val._;
    if (val.text && typeof val.text === 'string') return val.text;
    if (val.href && typeof val.href === 'string') return val.href;
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
}

export async function POST() {
  const errors: { url: string; error: string }[] = [];
  let totalIngested = 0;
  let totalSkipped = 0;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, ingestedCount: 0, errors: [{ url: 'config', error: 'Missing Supabase Env Variables' }] },
        { status: 400 }
      );
    }

    // const supabase = createClient(supabaseUrl, supabaseKey);

    let feedList = [
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
      { url: 'https://www.theguardian.com/world/rss', category: 'world' },
    ];

    try {
      const { data: sources } = await supabase.from('rss_sources').select('*').eq('is_active', true);
      if (sources && sources.length > 0) feedList = sources;
    } catch {
      // Fall back to default feeds
    }

    for (const feedSource of feedList) {
      const feedUrl = safeString(feedSource.url);

      try {
        const feed = await parser.parseURL(feedUrl);

        // SUGGESTED EDIT: sanitize BBC titles to TWNS
        const feedItems = (feed.items || []).map((item: any) => {
          const sanitizedTitle = (item.title || '').replace(/BBC/gi, 'TWNS');
          return {
            ...item,
            title: sanitizedTitle,
          }
        });

        const articlesToInsert = [];

        for (const item of feedItems) {
          const rawTitle = safeString(item.title);
          const rawLink = safeString(item.link || item.guid);
          const rawContent = safeString(item.contentSnippet || item.content || item.description);

          if (!rawTitle || !rawLink) continue;

          const safeSlug =
            rawTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '')
              .substring(0, 80) +
            '-' +
            Date.now() +
            Math.floor(Math.random() * 1000);

          let imageUrl: string | null = null;
          if (item.enclosure && item.enclosure.url) {
            imageUrl = safeString(item.enclosure.url);
          } else if (item['media:content'] && item['media:content'].$) {
            imageUrl = safeString(item['media:content'].$.url);
          }

          articlesToInsert.push({
            title: rawTitle,
            slug: safeSlug,
            summary: rawContent.substring(0, 300),
            content: rawContent,
            url: rawLink,
            original_url: rawLink,
            source_url: rawLink,
            image_url: imageUrl || '/twns-placeholder.jpg',
            category: safeString(feedSource.category) || 'world',
            country_code: 'US',
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          });
        }

                if (articlesToInsert.length > 0) {
          // Check existing URLs to deduplicate
          const incomingUrls = articlesToInsert.map(a => a.original_url);
          const { data: existingArticles } = await supabase
            .from('articles')
            .select('original_url')
            .in('original_url', incomingUrls);
          const existingUrlsSet = new Set(existingArticles?.map(a => a.original_url) ?? []);

          // Split new and duplicate articles
          const newArticles = articlesToInsert.filter(a => !existingUrlsSet.has(a.original_url));
          const skippedCount = articlesToInsert.length - newArticles.length;

          if (newArticles.length > 0) {
            // Insert only new articles
            const { error: insertError } = await supabase
              .from('articles')
              .upsert(newArticles, { onConflict: 'original_url', ignoreDuplicates: true });

            if (insertError) {
              errors.push({ url: feedUrl, error: safeString(insertError.message || insertError.details) });
            } else {
              totalIngested += newArticles.length;
            }
          }

          // Track skipped articles
          totalSkipped += skippedCount;
        }
      } catch (feedErr: any) {
        errors.push({ url: feedUrl, error: safeString(feedErr?.message || 'Failed to parse RSS feed') });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      ingestedCount: totalIngested,
      skippedCount: totalSkipped,
      errors: errors,
    });
  } catch (globalErr: any) {
    return NextResponse.json(
      { success: false, ingestedCount: 0, errors: [{ url: 'global', error: safeString(globalErr?.message) }] },
      { status: 500 }
    );
  }
}