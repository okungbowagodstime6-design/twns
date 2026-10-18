import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const articleFields = "id, slug, title, summary, category, country_code, published_at, metadata";
const fallbackCategories: CategoryFacet[] = ["Agriculture", "Automotive", "Business", "Education", "Entertainment", "Environment", "Finance", "Health", "Politics", "Science", "Security", "Sports", "Technology", "World"].map((name) => ({ name, slug: name.toLowerCase() }));
const fallbackCountries: Facet[] = [
  { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" }, { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" }, { code: "FR", name: "France" }, { code: "DE", name: "Germany" },
  { code: "IN", name: "India" }, { code: "CN", name: "China" }, { code: "JP", name: "Japan" }, { code: "AU", name: "Australia" },
  { code: "AE", name: "United Arab Emirates" }, { code: "BR", name: "Brazil" }, { code: "CA", name: "Canada" }
];

type Facet = { code: string; name: string };
type CategoryFacet = { name: string; slug: string };
type SearchArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  country_code: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};

function cleanedTerm(value: string) {
  return value.slice(0, 90).replace(/[%_*(),."\\']/g, " ").replace(/\s+/g, " ").trim();
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}

function dateAfter(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function articleQuery(supabase: NonNullable<ReturnType<typeof createSupabase>>, options: { term: string; category: string; country: string; from: string; to: string }) {
  let query = supabase.from("news_articles").select(articleFields).eq("status", "PUBLISHED").order("published_at", { ascending: false });
  if (options.term) {
    const pattern = `%${options.term}%`;
    query = query.or(`title.ilike.${pattern},summary.ilike.${pattern},category.ilike.${pattern},country_code.ilike.${pattern}`);
  }
  if (options.category) {
    const categories = options.category === "technology" ? ["technology", "TECHNOLOGY", "tech", "TECH"] : [options.category, options.category.toUpperCase()];
    query = query.in("category", categories);
  }
  if (options.country) query = query.eq("country_code", options.country);
  if (options.from) query = query.gte("published_at", `${options.from}T00:00:00.000Z`);
  if (options.to) query = query.lt("published_at", dateAfter(options.to));
  return query.limit(40);
}

export async function GET(request: NextRequest) {
  const supabase = createSupabase();
  if (!supabase) return NextResponse.json({ articles: [], categories: [], countries: [], error: "Search is not configured." }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const options = {
    term: cleanedTerm(params.get("q") ?? ""),
    category: params.get("category")?.slice(0, 60) ?? "",
    country: params.get("country")?.slice(0, 3).toUpperCase() ?? "",
    from: /^\d{4}-\d{2}-\d{2}$/.test(params.get("from") ?? "") ? params.get("from")! : "",
    to: /^\d{4}-\d{2}-\d{2}$/.test(params.get("to") ?? "") ? params.get("to")! : ""
  };

  const [mainResult, categoryResult, countryResult, facetArticles, topicResult, matchingCountries] = await Promise.all([
    articleQuery(supabase, options),
    supabase.from("categories").select("name, slug").order("name"),
    supabase.from("countries").select("code, name").order("name"),
    supabase.from("news_articles").select("category").eq("status", "PUBLISHED").not("category", "is", null).limit(300),
    options.term ? supabase.from("article_topics").select("article_id").ilike("topic", `%${options.term}%`).limit(80) : Promise.resolve({ data: [], error: null }),
    options.term ? supabase.from("countries").select("code").ilike("name", `%${options.term}%`).limit(20) : Promise.resolve({ data: [], error: null })
  ]);

  if (mainResult.error) return NextResponse.json({ articles: [], categories: fallbackCategories, countries: fallbackCountries, error: "Search data is temporarily unavailable." }, { status: 503 });

  const articles = (mainResult.data ?? []) as SearchArticle[];
  const topicIds: string[] = [];
  const countryCodes: string[] = [];
  (topicResult.data ?? []).forEach((item) => { const id = item.article_id as string; if (!topicIds.includes(id)) topicIds.push(id); });
  (matchingCountries.data ?? []).forEach((item) => { const code = item.code as string; if (!countryCodes.includes(code)) countryCodes.push(code); });
  const supplementalQueries = [];

  if (topicIds.length) {
    let query = supabase.from("news_articles").select(articleFields).eq("status", "PUBLISHED").in("id", topicIds);
    if (options.category) {
      const categories = options.category === "technology" ? ["technology", "TECHNOLOGY", "tech", "TECH"] : [options.category, options.category.toUpperCase()];
      query = query.in("category", categories);
    }
    if (options.country) query = query.eq("country_code", options.country);
    if (options.from) query = query.gte("published_at", `${options.from}T00:00:00.000Z`);
    if (options.to) query = query.lt("published_at", dateAfter(options.to));
    supplementalQueries.push(query.order("published_at", { ascending: false }).limit(40));
  }
  if (countryCodes.length && !options.country) {
    let query = supabase.from("news_articles").select(articleFields).eq("status", "PUBLISHED").in("country_code", countryCodes);
    if (options.category) {
      const categories = options.category === "technology" ? ["technology", "TECHNOLOGY", "tech", "TECH"] : [options.category, options.category.toUpperCase()];
      query = query.in("category", categories);
    }
    if (options.from) query = query.gte("published_at", `${options.from}T00:00:00.000Z`);
    if (options.to) query = query.lt("published_at", dateAfter(options.to));
    supplementalQueries.push(query.order("published_at", { ascending: false }).limit(40));
  }

  const supplementalResults = await Promise.all(supplementalQueries);
  const allArticles = new Map<string, SearchArticle>();
  articles.forEach((article) => allArticles.set(article.id, article));
  supplementalResults.forEach((result) => ((result.data ?? []) as SearchArticle[]).forEach((article) => allArticles.set(article.id, article)));
  const resultArticles: SearchArticle[] = [];
  allArticles.forEach((article) => resultArticles.push(article));
  resultArticles.sort((left, right) => Date.parse(right.published_at ?? "") - Date.parse(left.published_at ?? ""));
  resultArticles.splice(40);

  const categoryFacets = new Map<string, CategoryFacet>();
  for (const facet of categoryResult.data ?? []) categoryFacets.set(facet.slug, { name: facet.name, slug: facet.slug });
  for (const facet of facetArticles.data ?? []) {
    if (typeof facet.category !== "string" || !facet.category.trim()) continue;
    const name = facet.category.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    categoryFacets.set(slug, { name, slug });
  }

  const sortedCategories: CategoryFacet[] = [];
  categoryFacets.forEach((facet) => sortedCategories.push(facet));
  sortedCategories.sort((left, right) => left.name.localeCompare(right.name));
  return NextResponse.json({
    articles: resultArticles,
    categories: sortedCategories.length ? sortedCategories : fallbackCategories,
    countries: countryResult.data?.length ? countryResult.data as Facet[] : fallbackCountries,
    error: null
  });
}
