import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Auth guard — this endpoint must only be called by Vercel Cron (CRON_SECRET)
// or a logged-in editorial user. We check CRON_SECRET first.
// ---------------------------------------------------------------------------
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; TWNSBot/1.0)',
  },
});

function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj._ === 'string') return obj._;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.href === 'string') return obj.href;
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return String(val);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { success: false, ingestedCount: 0, errors: [{ url: 'config', error: 'Missing Supabase environment variables.' }] },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const errors: { url: string; error: string }[] = [];
  let totalIngested = 0;
  let totalSkipped = 0;

  try {
    // Fall back to two canonical feeds if no sources are configured
    let feedList: { url: string; category: string }[] = [
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
      { url: 'https://www.theguardian.com/world/rss', category: 'world' },
    ];

    try {
      const { data: sources } = await supabase.from('rss_sources').select('*').eq('is_active', true);
      if (sources && sources.length > 0) feedList = sources as { url: string; category: string }[];
    } catch {
      // Fall back to default feeds silently
    }

    for (const feedSource of feedList) {
      const feedUrl = safeString(feedSource.url);
      try {
        const feed = await parser.parseURL(feedUrl);
        // Resolve category_id once per feed (slug → uuid)
        const categorySlug = safeString(feedSource.category) || 'world';
        let categoryId: string | null = null;
        try {
          const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
          categoryId = cat?.id ?? null;
        } catch { /* leave null */ }

        const articlesToInsert: Record<string, unknown>[] = [];

        for (const item of feed.items ?? []) {
          const rawTitle = safeString(item.title);
          const rawLink = safeString(item.link || item.guid);
          const rawContent = safeString(item.contentSnippet || item.content || item.description);

          if (!rawTitle || !rawLink) continue;

          const safeSlug =
            rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 80) +
            '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

          articlesToInsert.push({
            title: rawTitle,
            slug: safeSlug,
            summary: rawContent.substring(0, 300) || null,
            content: rawContent || null,
            original_url: rawLink,
            source_name: new URL(feedUrl).hostname,
            category_id: categoryId,
            country_code: null,
            status: 'REVIEW',
            article_type: 'STANDARD',
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          });
        }

        if (articlesToInsert.length > 0) {
          const incomingUrls = articlesToInsert.map((a) => a.original_url as string);
          const { data: existingArticles } = await supabase
            .from('news_articles')
            .select('original_url')
            .in('original_url', incomingUrls);
          const existingUrlsSet = new Set((existingArticles ?? []).map((a: { original_url: string }) => a.original_url));

          const newArticles = articlesToInsert.filter((a) => !existingUrlsSet.has(a.original_url as string));
          totalSkipped += articlesToInsert.length - newArticles.length;

          if (newArticles.length > 0) {
            const { error: insertError } = await supabase
              .from('news_articles')
              .insert(newArticles);
            if (insertError) {
              errors.push({ url: feedUrl, error: safeString(insertError.message) });
            } else {
              totalIngested += newArticles.length;
            }
          }
        }
      } catch (feedErr: unknown) {
        errors.push({ url: feedUrl, error: safeString(feedErr instanceof Error ? feedErr.message : 'Failed to parse RSS feed') });
      }
    }

    return NextResponse.json({ success: errors.length === 0, ingestedCount: totalIngested, skippedCount: totalSkipped, errors });
  } catch (globalErr: unknown) {
    return NextResponse.json(
      { success: false, ingestedCount: 0, errors: [{ url: 'global', error: safeString(globalErr instanceof Error ? globalErr.message : 'Unknown error') }] },
      { status: 500 }
    );
  }
}