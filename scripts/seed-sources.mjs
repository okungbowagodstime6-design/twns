import { readFileSync } from 'fs';

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

async function seedSources() {
  console.log('Fetching category IDs...');
  const categories = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug`, { headers }).then(r => r.json());
  const catMap = new Map(categories.map(c => [c.slug, c.id]));

  const sourcesToSeed = [
    {
      name: "The Guardian World",
      source_type: "RSS",
      endpoint: "https://www.theguardian.com/world/rss",
      is_active: true,
      country_code: "GB",
      language_code: "en",
      category_id: catMap.get("world"),
      polling_interval_minutes: 20
    },
    {
      name: "BBC Technology",
      source_type: "RSS",
      endpoint: "https://feeds.bbci.co.uk/news/technology/rss.xml",
      is_active: true,
      country_code: "GB",
      language_code: "en",
      category_id: catMap.get("technology"),
      polling_interval_minutes: 30
    },
    {
      name: "BBC Business",
      source_type: "RSS",
      endpoint: "https://feeds.bbci.co.uk/news/business/rss.xml",
      is_active: true,
      country_code: "GB",
      language_code: "en",
      category_id: catMap.get("business"),
      polling_interval_minutes: 30
    },
    {
      name: "Al Jazeera English",
      source_type: "RSS",
      endpoint: "https://www.aljazeera.com/xml/rss/all.xml",
      is_active: true,
      country_code: "QA",
      language_code: "en",
      category_id: catMap.get("world"),
      polling_interval_minutes: 20
    },
    {
      name: "Deutsche Welle (DW)",
      source_type: "RSS",
      endpoint: "https://rss.dw.com/rdf/rss-en-all",
      is_active: true,
      country_code: "DE",
      language_code: "en",
      category_id: catMap.get("world"),
      polling_interval_minutes: 25
    },
    {
      name: "The Guardian Sport",
      source_type: "RSS",
      endpoint: "https://www.theguardian.com/uk/sport/rss",
      is_active: true,
      country_code: "GB",
      language_code: "en",
      category_id: catMap.get("sports"),
      polling_interval_minutes: 30
    }
  ];

  for (const src of sourcesToSeed) {
    // Check if source already exists by endpoint
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/news_sources?endpoint=eq.${encodeURIComponent(src.endpoint)}&select=id,name`,
      { headers }
    ).then(r => r.json());

    if (existing && existing.length > 0) {
      console.log(`Source already registered: ${src.name}`);
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/news_sources`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          ...src,
          health_status: "HEALTHY",
          next_run_at: new Date().toISOString()
        })
      });
      if (res.ok) {
        console.log(`✅ Registered news source: ${src.name}`);
      } else {
        const err = await res.text();
        console.error(`❌ Failed to register ${src.name}:`, err);
      }
    }
  }

  // Update BBC World to have category_id if missing
  const bbcWorldCat = catMap.get("world");
  if (bbcWorldCat) {
    await fetch(`${SUPABASE_URL}/rest/v1/news_sources?name=eq.BBC`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ category_id: bbcWorldCat, country_code: "GB", language_code: "en" })
    });
    console.log("✅ Updated existing BBC source with category_id and metadata");
  }

  console.log("\nFinished seeding source registry!");
}

seedSources().catch(console.error);
