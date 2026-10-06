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

async function runTest() {
  console.log('Testing connection to Supabase...');
  
  // 1. Check Categories
  const cats = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name,slug`, { headers }).then(r => r.json());
  console.log(`✅ Categories verified: ${cats.length} desks available`);

  // 2. Check Countries
  const countries = await fetch(`${SUPABASE_URL}/rest/v1/countries?select=code`, { headers }).then(r => r.json());
  console.log(`✅ Countries verified: ${countries.length} nations seeded`);

  // 3. Check News Sources
  const sources = await fetch(`${SUPABASE_URL}/rest/v1/news_sources?select=id,name,endpoint,health_status`, { headers }).then(r => r.json());
  console.log(`✅ Current sources:`, sources);

  // 4. Test fetch RSS from BBC
  console.log('\nTesting RSS fetch from BBC endpoint...');
  const res = await fetch('https://feeds.bbci.co.uk/news/world/rss.xml', {
    headers: { 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' }
  });
  console.log(`✅ BBC Feed status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log(`✅ BBC Feed received: ${text.length} bytes`);

  // 5. Check news_articles count
  const articles = await fetch(`${SUPABASE_URL}/rest/v1/news_articles?select=id,status&limit=5`, { headers }).then(r => r.json());
  console.log(`✅ Current news_articles count preview:`, articles.length);
}

runTest().catch(console.error);
