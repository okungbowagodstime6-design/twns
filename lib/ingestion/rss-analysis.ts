import { GoogleGenAI } from "@google/genai";

export type ArticleBreakdown = {
  summary_bullets: string[];
  full_analysis: string;
};

const analysisHeadings = [
  "## Executive Summary",
  "## Deep Breakdown",
  "## Market Impact",
  "## Key Takeaways"
];

function wordCount(value: string): number {
  return value.match(/\b[A-Za-z0-9]+(?:['’.-][A-Za-z0-9]+)*\b/g)?.length ?? 0;
}

function validateAnalysis(analysis: string): boolean {
  const trimmed = analysis.trim();
  const words = wordCount(trimmed);
  const headings = trimmed.match(/^#{1,6}\s.+$/gm) ?? [];
  const bodyWithoutHeadings = trimmed.replace(/^#{1,6}\s.+$/gm, "");
  if (words < 900 || words > 1400) return false;
  if (headings.length !== analysisHeadings.length || !headings.every((heading, index) => heading === analysisHeadings[index])) return false;
  if (/(?:^|\s)#[A-Za-z0-9_]/m.test(bodyWithoutHeadings)) return false;

  const executiveSummary = trimmed.match(/## Executive Summary\s*([\s\S]*?)(?=\n## )/)?.[1];
  const bullets = executiveSummary?.match(/^\s*[-*]\s+\*\*.+\*\*\s*$/gm) ?? [];
  if (bullets.length !== 3) return false;
  if (!bullets.every((bullet) => /[.!?]\s*\*\*\s*$/.test(bullet))) return false;

  return true;
}

function getLlmClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required for RSS article analysis.");
  return new GoogleGenAI({ apiKey });
}

export async function generateArticleBreakdown(input: {
  title: string;
  content: string;
  sourceName: string;
  category: string;
}): Promise<ArticleBreakdown> {
  const client = getLlmClient();
  const response = await client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: JSON.stringify({
      title: input.title,
      source: input.sourceName,
      category: input.category,
      article_text: input.content
    }),
    config: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      systemInstruction: [
        "You are TWNS's senior financial and technology news editor, producing professional, academic-standard news intelligence for professionals, founders, and investors.",
        "Use only the supplied title and article text. Do not invent facts, quotes, figures, dates, timelines, stakeholders, market reactions, institutional statements, or background context. Distinguish reported facts from analysis, identify material unknowns, and state when the source does not provide a requested detail.",
        "Write precise, mature, analytical, direct prose with immaculate grammar, proper capitalization, and clear paragraph breaks. Prioritize verifiable numbers, financial metrics, operational facts, and strategic implications. Eliminate conversational filler, promotional language, and clickbait.",
        "The full_analysis value must be clean Markdown, 900 to 1400 words inclusive, and follow this exact structure with these four headings in this order and no other headings:",
        "## Executive Summary — exactly three bulleted sentences; each bullet must be fully bold and summarize, respectively, the primary event, a core metric or financial figure (or explicitly say that the source provides none), and the key outcome or its stated uncertainty.",
        "## Deep Breakdown — provide a detailed, readable account of the reported timeline, available background, key stakeholders, and verified facts.",
        "## Market Impact — analyze strategic implications for relevant markets, competitors, macroeconomic conditions, or developer ecosystems only to the extent supported by the supplied text; clearly qualify reasoned implications.",
        "## Key Takeaways — provide a concise Markdown breakdown of reported data points, market reactions, and supporting institutional statements. Omit unavailable items or explicitly label them as unreported.",
        "Do not include social-media hashtags anywhere in the article. The four required Markdown headings are not hashtags.",
        "Return JSON with summary_bullets (exactly three concise factual strings, each without Markdown markup and corresponding to the three executive-summary bullets) and full_analysis (the structured Markdown article)."
      ].join(" ")
    }
  });

  const content = response.text;
  if (!content) throw new Error("The LLM returned an empty article breakdown.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("The LLM returned invalid JSON for the article breakdown.");
  }

  if (typeof parsed !== "object" || parsed === null || !("summary_bullets" in parsed) || !Array.isArray(parsed.summary_bullets)) {
    throw new Error("The LLM returned an incomplete article breakdown.");
  }

  const summaryBullets: string[] = [];
  for (const bullet of parsed.summary_bullets) {
    if (typeof bullet !== "string" || !bullet.trim()) {
      throw new Error("The LLM returned an incomplete article breakdown.");
    }
    summaryBullets.push(bullet.trim());
  }
  if (
    summaryBullets.length !== 3 ||
    summaryBullets.some((bullet) => bullet.includes("#") || wordCount(bullet) < 8 || wordCount(bullet) > 45) ||
    !("full_analysis" in parsed) ||
    typeof parsed.full_analysis !== "string" ||
    !validateAnalysis(parsed.full_analysis)
  ) {
    throw new Error("The LLM returned an article breakdown that does not meet the required structure, word counts, and formatting.");
  }

  return {
    summary_bullets: summaryBullets,
    full_analysis: parsed.full_analysis.trim()
  };
}
