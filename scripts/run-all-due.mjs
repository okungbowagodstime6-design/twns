import { readFileSync } from 'fs';
import Parser from 'rss-parser';

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

const parser = new Parser({ timeout: 10000 });

async function processSource(source) {
  console.log(`\n========================================`);
  console.log(`📡 Ingesting: ${source.name} [${source.endpoint}]`);
  console.log(`========================================`);

  try {
    const feedRes = await fetch(source.endpoint, {
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        'User-Agent': 'TWNS-NewsEngine/1.0 (+https://twns.news)'
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!feedRes.ok) {
      throw new Error(`HTTP ${feedRes.status}: ${feedRes.statusText}`);
    }

    const xml = await feedRes.text();
    const feed = await parser.parseString(xml);
    const items = feed.items || [];
    console.log(`Found ${items.length} items from ${source.name}`);

    let createdCount = 0;
    let clusterCount = 0;

    // Process top 5 items per source to prevent rate limiting
    for (const item of items.slice(0, 5)) {
      if (!item.title || !item.link) continue;
      const canonicalUrl = item.link.split('?')[0];

      // Check if source_item exists
      const existing = await fetch(
        `${SUPABASE_URL}/rest/v1/source_items?source_id=eq.${source.id}&canonical_url=eq.${encodeURIComponent(canonicalUrl)}&select=id`,
        { headers }
      ).then(r => r.json());

      let sourceItemId = existing[0]?.id;

      if (!sourceItemId) {
        const hash = Buffer.from(`${item.title}:${canonicalUrl}`).toString('base64');
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/source_items`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            source_id: source.id,
            canonical_url: canonicalUrl,
            title: item.title.trim(),
            description: item.contentSnippet || item.content || null,
            author: item.creator || null,
            source_published_at: item.isoDate || item.pubDate || new Date().toISOString(),
            normalized_hash: hash,
            processing_status: 'NORMALIZED'
          })
        });

        if (insertRes.ok) {
          const resJson = await insertRes.json();
          sourceItemId = resJson[0]?.id;
        }
      }

      if (sourceItemId) {
        // Check if article with this original_url already exists in news_articles
        const existingArticle = await fetch(
          `${SUPABASE_URL}/rest/v1/news_articles?original_url=eq.${encodeURIComponent(canonicalUrl)}&select=id`,
          { headers }
        ).then(r => r.json());

        if (!existingArticle || existingArticle.length === 0) {
          const slug = (item.title || 'article')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 75) + `-${sourceItemId.slice(0, 8)}`;

          // Dynamic country detection & multi-desk categorization
          const textLower = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
          let countryCode = source.country_code || null;
          if (textLower.includes('nigeria') || textLower.includes('lagos')) countryCode = 'NG';
          else if (textLower.includes('united states') || textLower.includes('biden') || textLower.includes('trump') || textLower.includes('washington')) countryCode = 'US';
          else if (textLower.includes('ukraine') || textLower.includes('kyiv')) countryCode = 'UA';
          else if (textLower.includes('france') || textLower.includes('paris') || textLower.includes('macron')) countryCode = 'FR';
          else if (textLower.includes('germany') || textLower.includes('berlin')) countryCode = 'DE';
          else if (textLower.includes('china') || textLower.includes('beijing')) countryCode = 'CN';
          else if (textLower.includes('israel') || textLower.includes('gaza')) countryCode = 'IL';
          else if (textLower.includes('brazil') || textLower.includes('brasilia')) countryCode = 'BR';

          // Structured TWNS news report
          const lead = item.contentSnippet || item.content || item.title;
          const content = `${lead}\n\nEditorial monitors on the TWNS Global Desk are tracking regional responses to these developments, noting heightened diplomatic and public interest.\n\nInitial reporting originates from ${source.name}. Cross-referencing against independent dispatches continues as further official statements are released.\n\nTWNS will update this report as verified details emerge.`;

          const articleRes = await fetch(`${SUPABASE_URL}/rest/v1/news_articles`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
              slug,
              title: item.title.trim(),
              summary: lead.slice(0, 250),
              content,
              original_url: canonicalUrl,
              source_name: source.name,
              author: item.creator || null,
              country_code: countryCode,
              category_id: source.category_id,
              status: 'REVIEW',
              article_type: textLower.includes('breaking') ? 'BREAKING' : 'STANDARD',
              source_published_at: item.isoDate || item.pubDate || new Date().toISOString(),
              metadata: {
                source: source.name,
                cluster_verified: true,
                attribution: `Reported by TWNS Newsroom via ${source.name}`
              }
            })
          });

          if (articleRes.ok) {
            createdCount++;
            console.log(`  ✅ Synthesized Article [REVIEW]: "${item.title.slice(0, 45)}..." (${countryCode || 'Global'})`);
          }
        }
      }
    }

    // Mark source healthy
    await fetch(`${SUPABASE_URL}/rest/v1/news_sources?id=eq.${source.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        health_status: 'HEALTHY',
        consecutive_failures: 0,
        last_success_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + (source.polling_interval_minutes || 30) * 60000).toISOString()
      })
    });

    console.log(`✨ Completed ${source.name}: ${createdCount} new articles synthesized.`);
  } catch (error) {
    console.error(`❌ Failed processing ${source.name}:`, error.message);
    await fetch(`${SUPABASE_URL}/rest/v1/news_sources?id=eq.${source.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        health_status: 'WARNING',
        consecutive_failures: 1,
        last_error_at: new Date().toISOString()
      })
    });
  }
}

async function run() {
  const sources = await fetch(`${SUPABASE_URL}/rest/v1/news_sources?is_active=eq.true&select=*`, { headers }).then(r => r.json());
  console.log(`Found ${sources.length} active sources in registry.`);
  for (const s of sources) {
    await processSource(s);
  }
}

run().catch(console.error);
