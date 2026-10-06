export const DEFAULT_COUNTRY_CODE = "NG";

export interface CategoryRule {
  slug: string;
  weight?: number;
  terms: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: "breaking",
    terms: ["breaking news", "breaking:", "urgent:", "just in:", "flash:", "bulletin", "alert:"]
  },
  {
    slug: "politics",
    terms: [
      "election", "parliament", "congress", "senate", "prime minister", "president", "white house",
      "downing street", "legislation", "bill passes", "supreme court", "diplomat", "treaty", "campaign",
      "referendum", "ballot", "democrat", "republican", "tory", "labour party", "sanction"
    ]
  },
  {
    slug: "finance",
    terms: [
      "central bank", "interest rate", "inflation rate", "treasury", "bond yield", "federal reserve",
      "monetary policy", "crypto", "bitcoin", "ethereum", "fintech", "banking crisis", "currency devaluation",
      "imf", "world bank", "debt ceiling", "forex", "hedge fund", "venture capital"
    ]
  },
  {
    slug: "business",
    terms: [
      "economy", "shares", "stock market", "revenue", "quarterly earnings", "merger", "acquisition",
      "ceo", "trade deal", "retail sales", "export", "import", "supply chain", "corporate", "layoffs",
      "startup", "manufacturing", "commerce", "tariff", "market rally"
    ]
  },
  {
    slug: "technology",
    terms: [
      "artificial intelligence", " ai ", "machine learning", "software", "semiconductor", "microchip",
      "cybersecurity", "hacker", "ransomware", "gadget", "smartphone", "apple", "google", "microsoft",
      "nvidia", "metaverse", "cloud computing", "robotics", "quantum", "app store", "big tech"
    ]
  },
  {
    slug: "sports",
    terms: [
      "football", "soccer", "champions league", "premier league", "la liga", "serie a", "bundesliga",
      "world cup", "nba", "nfl", "formula 1", "f1", "tennis", "grand slam", "wimbledon", "olympics",
      "athletics", "cricket", "rugby", "boxing", "ufc", "marathon", "goal", "tournament", "trophy"
    ]
  },
  {
    slug: "health",
    terms: [
      "vaccine", "outbreak", "virus", "pandemic", "cancer", "hospital", "who ", "world health organization",
      "medical trial", "drug approval", "fda", "disease", "mental health", "cardiovascular", "alzheimer",
      "public health", "pharmaceutical", "therapy", "clinical trial"
    ]
  },
  {
    slug: "science",
    terms: [
      "nasa", "space telescope", "james webb", "astronomy", "physics", "quantum mechanics", "asteroid",
      "mars rover", "spacex", "black hole", "galaxy", "biologist", "fossil", "archaeology", "laboratory",
      "research paper", "nobel prize in science", "particle collider"
    ]
  },
  {
    slug: "environment",
    terms: [
      "climate change", "global warming", "carbon emissions", "cop2", "deforestation", "renewable energy",
      "solar power", "wind turbine", "biodiversity", "wildfire", "oil spill", "conservation", "glacier melt",
      "fossil fuels", "pollution", "greenhouse gas", "endangered species"
    ]
  },
  {
    slug: "weather",
    terms: [
      "hurricane", "typhoon", "cyclone", "tornado", "blizzard", "heatwave", "flash flood", "meteorological",
      "forecast", "severe storm", "monsoon", "drought", "tsunami warning", "gale force"
    ]
  },
  {
    slug: "security",
    terms: [
      "military", "armed forces", "missile", "airstrike", "ceasefire", "nato", "defense ministry",
      "pentagon", "warfare", "counter-terrorism", "border security", "intelligence agency", "cia",
      "mi6", "hostage", "insurgency", "naval fleet", "arms deal"
    ]
  },
  {
    slug: "agriculture",
    terms: [
      "crop yield", "harvest", "grain supply", "wheat export", "farming", "fertilizer", "livestock",
      "food security", "agribusiness", "drought threatens crops", "irrigation", "poultry", "agriculture"
    ]
  },
  {
    slug: "education",
    terms: [
      "university", "campus", "academic", "tuition", "students", "professors", "higher education",
      "school curriculum", "literacy", "scholarship", "exam results", "degree"
    ]
  },
  {
    slug: "automotive",
    terms: [
      "electric vehicle", " ev ", "tesla", "automaker", "car manufacturer", "autonomous driving",
      "battery tech", "hybrid car", "toyota", "ford", "bmw", "volkswagen", "vehicle recall"
    ]
  },
  {
    slug: "entertainment",
    terms: [
      "box office", "hollywood", "nollywood", "bollywood", "oscar", "grammy", "emmy", "film festival",
      "netflix", "cinema", "music album", "celebrity", "actor", "actress", "concert", "streaming service"
    ]
  },
  {
    slug: "world",
    terms: ["international", "global", "united nations", "summit", "cross-border", "treaty", "foreign affairs"]
  }
];

export interface CountryEntity {
  code: string;
  name: string;
  terms: string[];
}

export const COUNTRY_ENTITIES: CountryEntity[] = [
  // Africa
  { code: "NG", name: "Nigeria", terms: ["nigeria", "nigerian", "lagos", "abuja", "kano", "port harcourt"] },
  { code: "GH", name: "Ghana", terms: ["ghana", "ghanaian", "accra", "kumasi"] },
  { code: "KE", name: "Kenya", terms: ["kenya", "kenyan", "nairobi", "mombasa"] },
  { code: "ZA", name: "South Africa", terms: ["south africa", "south african", "johannesburg", "cape town", "pretoria", "durban"] },
  { code: "EG", name: "Egypt", terms: ["egypt", "egyptian", "cairo", "alexandria", "suez"] },
  { code: "ET", name: "Ethiopia", terms: ["ethiopia", "ethiopian", "addis ababa", "tigray"] },
  { code: "RW", name: "Rwanda", terms: ["rwanda", "rwandan", "kigali"] },
  { code: "UG", name: "Uganda", terms: ["uganda", "ugandan", "kampala"] },
  { code: "TZ", name: "Tanzania", terms: ["tanzania", "tanzanian", "dar es salaam", "dodoma"] },
  { code: "SN", name: "Senegal", terms: ["senegal", "senegalese", "dakar"] },
  { code: "CI", name: "Côte d'Ivoire", terms: ["côte d'ivoire", "ivory coast", "abidjan"] },
  { code: "MA", name: "Morocco", terms: ["morocco", "moroccan", "rabat", "casablanca"] },
  { code: "DZ", name: "Algeria", terms: ["algeria", "algerian", "algiers"] },
  { code: "CD", name: "DR Congo", terms: ["dr congo", "drc", "democratic republic of the congo", "kinshasa"] },
  { code: "SD", name: "Sudan", terms: ["sudan", "sudanese", "khartoum", "darfur"] },
  { code: "SO", name: "Somalia", terms: ["somalia", "somali", "mogadishu"] },

  // Americas
  { code: "US", name: "United States", terms: ["united states", "u.s.", "usa", "america", "washington", "white house", "capitol hill", "wall street", "pentagon"] },
  { code: "CA", name: "Canada", terms: ["canada", "canadian", "ottawa", "toronto", "montreal", "vancouver"] },
  { code: "MX", name: "Mexico", terms: ["mexico", "mexican", "mexico city"] },
  { code: "BR", name: "Brazil", terms: ["brazil", "brazilian", "brasilia", "são paulo", "rio de janeiro"] },
  { code: "AR", name: "Argentina", terms: ["argentina", "argentine", "buenos aires"] },
  { code: "CO", name: "Colombia", terms: ["colombia", "colombian", "bogota"] },
  { code: "CL", name: "Chile", terms: ["chile", "chilean", "santiago"] },
  { code: "VE", name: "Venezuela", terms: ["venezuela", "venezuelan", "caracas"] },
  { code: "PE", name: "Peru", terms: ["peru", "peruvian", "lima"] },
  { code: "CU", name: "Cuba", terms: ["cuba", "cuban", "havana"] },

  // Europe
  { code: "GB", name: "United Kingdom", terms: ["britain", "british", "united kingdom", "uk", "london", "downing street", "westminster", "scotland", "wales"] },
  { code: "FR", name: "France", terms: ["france", "french", "paris", "elysee", "macron"] },
  { code: "DE", name: "Germany", terms: ["germany", "german", "berlin", "bundestag"] },
  { code: "IT", name: "Italy", terms: ["italy", "italian", "rome", "milan"] },
  { code: "ES", name: "Spain", terms: ["spain", "spanish", "madrid", "barcelona"] },
  { code: "UA", name: "Ukraine", terms: ["ukraine", "ukrainian", "kyiv", "zelensky"] },
  { code: "RU", name: "Russia", terms: ["russia", "russian", "moscow", "kremlin", "putin"] },
  { code: "PL", name: "Poland", terms: ["poland", "polish", "warsaw"] },
  { code: "NL", name: "Netherlands", terms: ["netherlands", "dutch", "amsterdam", "the hague"] },
  { code: "CH", name: "Switzerland", terms: ["switzerland", "swiss", "geneva", "zurich", "bern"] },
  { code: "SE", name: "Sweden", terms: ["sweden", "swedish", "stockholm"] },
  { code: "NO", name: "Norway", terms: ["norway", "norwegian", "oslo"] },
  { code: "TR", name: "Turkey", terms: ["turkey", "turkish", "ankara", "istanbul", "erdogan"] },

  // Asia-Pacific & Middle East
  { code: "CN", name: "China", terms: ["china", "chinese", "beijing", "shanghai", "xi jinping"] },
  { code: "IN", name: "India", terms: ["india", "indian", "new delhi", "mumbai", "modi"] },
  { code: "JP", name: "Japan", terms: ["japan", "japanese", "tokyo"] },
  { code: "KR", name: "South Korea", terms: ["south korea", "korean", "seoul"] },
  { code: "KP", name: "North Korea", terms: ["north korea", "pyongyang", "kim jong un"] },
  { code: "TW", name: "Taiwan", terms: ["taiwan", "taiwanese", "taipei"] },
  { code: "AU", name: "Australia", terms: ["australia", "australian", "canberra", "sydney", "melbourne"] },
  { code: "NZ", name: "New Zealand", terms: ["new zealand", "wellington", "auckland"] },
  { code: "SG", name: "Singapore", terms: ["singapore", "singaporean"] },
  { code: "ID", name: "Indonesia", terms: ["indonesia", "indonesian", "jakarta"] },
  { code: "PK", name: "Pakistan", terms: ["pakistan", "pakistani", "islamabad", "karachi"] },
  { code: "BD", name: "Bangladesh", terms: ["bangladesh", "bangladeshi", "dhaka"] },
  { code: "PH", name: "Philippines", terms: ["philippines", "filipino", "manila"] },
  { code: "SA", name: "Saudi Arabia", terms: ["saudi arabia", "saudi", "riyadh"] },
  { code: "AE", name: "United Arab Emirates", terms: ["uae", "united arab emirates", "dubai", "abu dhabi"] },
  { code: "IL", name: "Israel", terms: ["israel", "israeli", "jerusalem", "tel aviv", "netanyahu"] },
  { code: "PS", name: "Palestine", terms: ["palestine", "palestinian", "gaza", "west bank", "ramallah"] },
  { code: "IR", name: "Iran", terms: ["iran", "iranian", "tehran"] },
  { code: "IQ", name: "Iraq", terms: ["iraq", "iraqi", "baghdad"] },
  { code: "QA", name: "Qatar", terms: ["qatar", "qatari", "doha"] }
];

function haystack(parts: Array<string | null | undefined>): string {
  return ` ${parts.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
}

export function inferCategorySlug(...parts: Array<string | null | undefined>): string {
  const text = haystack(parts);
  
  // Check breaking news patterns first
  const breakingRule = CATEGORY_RULES.find(r => r.slug === "breaking");
  if (breakingRule && breakingRule.terms.some(t => text.includes(t))) {
    return "breaking";
  }

  // Score matches to find highest relevance category
  let bestMatch = "world";
  let maxScore = 0;

  for (const rule of CATEGORY_RULES) {
    if (rule.slug === "world") continue;
    let score = 0;
    for (const term of rule.terms) {
      if (text.includes(term)) {
        score += term.length > 5 ? 2 : 1; // Prioritize specific phrases
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule.slug;
    }
  }

  return bestMatch;
}

export function inferCountryCode(fallback: string | null | undefined, ...parts: Array<string | null | undefined>): string | null {
  const text = haystack(parts);
  
  // Look for direct country/entity mentions in the story content
  for (const entity of COUNTRY_ENTITIES) {
    for (const term of entity.terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(text)) {
        return entity.code;
      }
    }
  }

  // Fallback to source country code if provided, otherwise null (global)
  return fallback ?? null;
}

export function inferArticleType(...parts: Array<string | null | undefined>): "BREAKING" | "DEVELOPING" | "STANDARD" | "ANALYSIS" {
  const text = haystack(parts);
  if (text.includes("breaking") || text.includes("urgent:") || text.includes("just in")) return "BREAKING";
  if (text.includes("developing") || text.includes("live update") || text.includes("live:") || text.includes("what we know")) return "DEVELOPING";
  if (text.includes("analysis:") || text.includes("explainer:") || text.includes("in-depth") || text.includes("opinion:")) return "ANALYSIS";
  return "STANDARD";
}

export function resolveCategorySlug(slug: string): string {
  const aliases: Record<string, string> = {
    tech: "technology",
    culture: "entertainment",
    "breaking-news": "breaking",
    "world-news": "world",
    biz: "business",
    markets: "finance",
    climate: "environment"
  };
  return aliases[slug] ?? slug;
}
