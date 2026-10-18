import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const feeds = [
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", category: "Finance" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "Finance" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "Finance" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "Crypto" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "Crypto" },
  { name: "Decrypt", url: "https://decrypt.co/feed", category: "Crypto" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech & AI" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", category: "Tech & AI" },
  { name: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Tech & AI" },
  { name: "TechCabal", url: "https://techcabal.com/feed/", category: "African Fintech & Markets" },
  { name: "Disrupt Africa", url: "https://disrupt-africa.com/feed/", category: "African Fintech & Markets" }
] as const;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await supabase
    .from("feeds")
    .upsert(feeds.map((feed) => ({ ...feed, is_active: true })), {
      onConflict: "url",
      ignoreDuplicates: true
    })
    .select("url");

  if (error) throw new Error(`Unable to seed RSS feeds: ${error.message}`);
  console.log(`Seeded ${data.length} new RSS feeds; existing URLs were left unchanged.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
