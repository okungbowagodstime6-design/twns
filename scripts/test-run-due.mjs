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

async function testPipeline() {
  console.log('--- 1. Fetching active source from news_sources ---');
  const sources = await fetch(`${SUPABASE_URL}/rest/v1/news_sources?is_active=eq.true&select=*`, { headers }).then(r => r.json());
  if (!sources || sources.length === 0) {
    console.error('No active sources found!');
    return;
  }
  const source = sources[0];
  console.log(`Source found: ${source.name} (${source.endpoint})`);

  console.log('\n--- 2. Fetching & parsing RSS items ---');
  const parser = new Parser({ timeout: 10000 });
  const feedRes = await fetch(source.endpoint, {
    headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
  });
  const xml = await feedRes.text();
  const feed = await parser.parseString(xml);
  console.log(`Feed title: "${feed.title}", items count: ${feed.items?.length || 0}`);

  // Fetch categories to resolve category_id
  const categories = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug`, { headers }).then(r => r.json());
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
  const defaultCatId = categoryMap.get('world') || categories[0]?.id;

  console.log('\n--- 3. Testing upsert to source_items ---');
  const sampleItems = (feed.items || []).slice(0, 5);
  let insertedCount = 0;

  for (const item of sampleItems) {
    const canonicalUrl = item.link?.split('?')[0] || '';
    const hash = Buffer.from(`${item.title}:${canonicalUrl}`).toString('base64');
    
    // Check if source_item exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/source_items?source_id=eq.${source.id}&canonical_url=eq.${encodeURIComponent(canonicalUrl)}&select=id`,
      { headers }
    ).then(r => r.json());

    let sourceItemId = checkRes[0]?.id;
    if (!sourceItemId) {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/source_items`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          source_id: source.id,
          canonical_url: canonicalUrl,
          title: item.title?.trim() || '',
          description: item.contentSnippet || item.content || null,
          author: item.creator || null,
          source_published_at: item.isoDate || item.pubDate || new Date().toISOString(),
          normalized_hash: hash,
          processing_status: 'NORMALIZED'
        })
      });
      if (insertRes.ok) {
        const created = await insertRes.json();
        sourceItemId = created[0]?.id;
        insertedCount++;
        console.log(`  + Inserted source_item: "${item.title?.slice(0, 45)}..."`);
      } else {
        const err = await insertRes.text();
        console.error(`  x Failed to insert source_item:`, err);
      }
    } else {
      console.log(`  = Already in source_items: "${item.title?.slice(0, 45)}..."`);
    }

    // Now test creating a review article from item
    if (sourceItemId) {
      const slug = (item.title || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 70) + `-${sourceItemId.slice(0, 8)}`;

      // Check if article with this original_url already exists
      const existingArt = await fetch(
        `${SUPABASE_URL}/rest/v1/news_articles?original_url=eq.${encodeURIComponent(canonicalUrl)}&select=id`,
        { headers }
      ).then(r => r.json());

      if (!existingArt || existingArt.length === 0) {
        const artRes = await fetch(`${SUPABASE_URL}/rest/v1/news_articles`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            slug,
            title: item.title?.trim() || '',
            summary: item.contentSnippet || item.content || null,
            original_url: canonicalUrl,
            source_name: source.name,
            author: item.creator || null,
            country_code: 'GB', // Test with valid country code now that countries are seeded!
            category_id: defaultCatId,
            status: 'REVIEW',
            article_type: 'STANDARD',
            source_published_at: item.isoDate || item.pubDate || new Date().toISOString(),
            metadata: { source: source.name, automated: true }
          })
        });

        if (artRes.ok) {
          const art = await artRes.json();
          console.log(`  ✅ Created news_article (REVIEW): "${slug}" [${art[0]?.id}]`);
        } else {
          const artErr = await artRes.text();
          console.error(`  ❌ Error creating article:`, artErr);
        }
      } else {
        console.log(`  = news_article already exists for this URL.`);
      }
    }
  }

  // Update source health
  await fetch(`${SUPABASE_URL}/rest/v1/news_sources?id=eq.${source.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      health_status: 'HEALTHY',
      consecutive_failures: 0,
      last_success_at: new Date().toISOString()
    })
  });
  console.log(`\n✅ Source ${source.name} marked as HEALTHY.`);
}

testPipeline().catch(console.error);
