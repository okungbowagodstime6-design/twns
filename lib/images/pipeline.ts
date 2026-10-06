export interface ArticleVisual {
  imageUrl: string;
  isGenerated: boolean;
  credit: string;
  caption?: string;
}

export interface VisualContext {
  title: string;
  category: string;
  countryCode?: string | null;
  sourceName: string;
}

// Trusted media CDNs permitted for source thumbnail display
const TRUSTED_MEDIA_DOMAINS = [
  "bbci.co.uk",
  "guim.co.uk",
  "guardian.com",
  "aljazeera.com",
  "dw.com",
  "reuters.com",
  "apnews.com"
];

const DESK_GRADIENTS: Record<string, { start: string; end: string; accent: string }> = {
  breaking: { start: "#7f1d1d", end: "#18181b", accent: "#ef4444" },
  technology: { start: "#0c4a6e", end: "#09090b", accent: "#0284c7" },
  business: { start: "#064e3b", end: "#09090b", accent: "#10b981" },
  finance: { start: "#14532d", end: "#09090b", accent: "#22c55e" },
  sports: { start: "#78350f", end: "#09090b", accent: "#f59e0b" },
  world: { start: "#1e1b4b", end: "#09090b", accent: "#6366f1" },
  security: { start: "#312e81", end: "#09090b", accent: "#818cf8" },
  science: { start: "#3b0764", end: "#09090b", accent: "#a855f7" },
  health: { start: "#134e4a", end: "#09090b", accent: "#14b8a6" },
  environment: { start: "#14532d", end: "#09090b", accent: "#16a34a" },
  entertainment: { start: "#701a75", end: "#09090b", accent: "#d946ef" },
  default: { start: "#18181b", end: "#09090b", accent: "#71717a" }
};

/**
 * Extract allowed source image from raw feed items if from a trusted media domain
 */
export function extractSourceImage(rawItem: unknown): { url: string; credit?: string } | null {
  if (!rawItem || typeof rawItem !== "object") return null;
  const item = rawItem as Record<string, unknown>;

  // Check enclosure
  if (item.enclosure && typeof item.enclosure === "object") {
    const enc = item.enclosure as { url?: string; type?: string };
    if (enc.url && enc.type?.startsWith("image/")) {
      if (isTrustedMediaUrl(enc.url)) return { url: enc.url };
    }
  }

  // Check media:content or media:thumbnail
  const mediaContent = (item["media:content"] || item["media:thumbnail"]) as Record<string, unknown> | undefined;
  if (mediaContent && typeof mediaContent === "object") {
    const mediaUrl = (mediaContent["$"] as { url?: string } | undefined)?.url || (mediaContent.url as string | undefined);
    if (mediaUrl && isTrustedMediaUrl(mediaUrl)) {
      return { url: mediaUrl };
    }
  }

  return null;
}

function isTrustedMediaUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return TRUSTED_MEDIA_DOMAINS.some((domain) => url.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Generate a bespoke SVG Editorial Card with TWNS Newsroom typography and branding
 */
export function generateEditorialGraphicSvg(context: VisualContext): string {
  const deskKey = context.category.toLowerCase();
  const theme = DESK_GRADIENTS[deskKey] || DESK_GRADIENTS.default;

  // Escape XML characters
  const cleanTitle = context.title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  // Break title into lines (max ~38 chars per line)
  const words = cleanTitle.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > 36 && lines.length < 3) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = `${currentLine} ${word}`.trim();
    }
  }
  if (currentLine) lines.push(currentLine);

  const titleLinesSvg = lines
    .slice(0, 3)
    .map((line, idx) => `<tspan x="64" dy="${idx === 0 ? 0 : 54}">${line}${idx === 2 && lines.length > 3 ? "…" : ""}</tspan>`)
    .join("");

  const countryBadge = context.countryCode
    ? `<rect x="230" y="56" width="60" height="28" rx="4" fill="#27272a" />
       <text x="260" y="75" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#f4f4f5" text-anchor="middle">${context.countryCode}</text>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.start}" stop-opacity="0.9" />
        <stop offset="60%" stop-color="${theme.end}" stop-opacity="0.98" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="20%" r="50%">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
      </radialGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="630" fill="url(#glow)" />
    
    <!-- Grid Overlay -->
    <g opacity="0.04" stroke="#ffffff" stroke-width="1">
      <line x1="0" y1="157" x2="1200" y2="157" />
      <line x1="0" y1="315" x2="1200" y2="315" />
      <line x1="0" y1="472" x2="1200" y2="472" />
      <line x1="300" y1="0" x2="300" y2="630" />
      <line x1="600" y1="0" x2="600" y2="630" />
      <line x1="900" y1="0" x2="900" y2="630" />
    </g>

    <!-- Header Badges -->
    <g>
      <rect x="64" y="56" width="150" height="28" rx="4" fill="${theme.accent}" />
      <text x="139" y="75" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="1.5" fill="#ffffff" text-anchor="middle">${context.category.toUpperCase()}</text>
      ${countryBadge}
    </g>

    <!-- Brand Header -->
    <text x="1136" y="75" font-family="system-ui, sans-serif" font-size="15" font-weight="700" letter-spacing="3" fill="#a1a1aa" text-anchor="end">TWNS NEWSROOM</text>

    <!-- Headline -->
    <text x="64" y="240" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
      ${titleLinesSvg}
    </text>

    <!-- Footer Bar -->
    <line x1="64" y1="540" x2="1136" y2="540" stroke="#27272a" stroke-width="1.5" />
    <text x="64" y="575" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#71717a">VERIFIED TWNS DISPATCH · GLOBAL MONITORING</text>
    <text x="1136" y="575" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#52525b" text-anchor="end">INITIAL DISPATCH VIA ${context.sourceName.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolve the optimal visual for an article:
 * Uses licensed source image if available, or generates a TWNS Editorial Card.
 */
export function resolveArticleVisual(
  rawItem: unknown,
  context: VisualContext
): ArticleVisual {
  const sourceImg = extractSourceImage(rawItem);
  if (sourceImg) {
    return {
      imageUrl: sourceImg.url,
      isGenerated: false,
      credit: `Source: ${context.sourceName}`
    };
  }

  // Generate TWNS branded graphic
  const generatedSvgDataUri = generateEditorialGraphicSvg(context);
  return {
    imageUrl: generatedSvgDataUri,
    isGenerated: true,
    credit: "TWNS Editorial Graphic"
  };
}
