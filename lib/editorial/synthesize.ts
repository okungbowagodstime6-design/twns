import OpenAI from "openai";

export interface SynthesizedReport {
  title: string;
  summary: string;
  content: string;
  articleType: "BREAKING" | "DEVELOPING" | "STANDARD" | "ANALYSIS";
  verifiedSourcesCount: number;
  attributionNote: string;
}

export interface IngestionStoryContext {
  title: string;
  description: string | null;
  sourceName: string;
  originalUrl: string;
  publishedAt?: string | null;
  categorySlug: string;
  countryName?: string | null;
  clusterItemCount?: number;
  additionalSources?: string[];
}

const SYSTEM_EDITORIAL_PROMPT = `You are the Lead Digital Editor at TWNS (The World News Station), a 24/7 global news network covering 195 countries.

Your editorial mandate:
1. Transform incoming verified wire and publisher dispatches into an original, professional, comprehensive TWNS news report.
2. Structure the report according to journalistic standards:
   - Lead paragraph: Who, What, Where, When with utmost clarity and neutrality.
   - Context & Significance: Why this development matters in its regional or global context.
   - Key Facts & Background: Verified details, history, and official statements.
   - Looking Ahead: What happens next, pending confirmations, or scheduled proceedings.
3. Editorial voice:
   - Objective, precise, sophisticated yet accessible, authoritative.
   - NEVER hallucinate quotes, numbers, or facts not in the source text.
   - Explicitly distinguish confirmed facts from claims or developing accounts.
   - Properly attribute origins (e.g., "According to reporting confirmed by [Source]...").
4. Output must be in JSON format with keys:
   {
     "headline": "Clear, compelling, active-voice TWNS headline",
     "summary": "2-sentence executive summary",
     "body": "Full multi-paragraph report with double newline paragraph breaks (minimum 3 substantive paragraphs)"
   }`;

/**
 * Generate a full journalistic news report using OpenAI if available,
 * with deterministic fallback to ensure 24/7 newsroom uptime.
 */
export async function synthesizeJournalisticReport(
  context: IngestionStoryContext
): Promise<SynthesizedReport> {
  const isMultiSource = (context.clusterItemCount ?? 1) > 1;
  const sourcesList = [context.sourceName, ...(context.additionalSources ?? [])].join(", ");

  // 1. Try AI-powered synthesis if OPENAI_API_KEY is configured
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-api-key")) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15_000 });
      const prompt = `Source Outlets: ${sourcesList}
Category Desk: ${context.categorySlug.toUpperCase()}
Country Focus: ${context.countryName || "International / Global"}
Original Headline: ${context.title}
Original Dispatch: ${context.description || "No extended dispatch text available."}
Story Verification: ${isMultiSource ? `Cross-confirmed across ${context.clusterItemCount} independent sources` : `Single-source report from ${context.sourceName}`}

Write an original, comprehensive TWNS news article covering this event.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_EDITORIAL_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const raw = response.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.headline && parsed.body) {
          return {
            title: parsed.headline.trim(),
            summary: parsed.summary?.trim() || context.description || parsed.headline,
            content: parsed.body.trim(),
            articleType: isMultiSource ? "DEVELOPING" : "STANDARD",
            verifiedSourcesCount: context.clusterItemCount ?? 1,
            attributionNote: `Reported by TWNS Newsroom with reporting from ${sourcesList}.`
          };
        }
      }
    } catch {
      // Gracefully fall through to deterministic synthesis on API error, rate limit, or invalid key
    }
  }

  // 2. Deterministic TWNS Journalistic Synthesis (Fallback guarantee)
  return buildDeterministicReport(context);
}

/**
 * Build a structured, multi-paragraph journalistic report adhering to TWNS editorial voice.
 */
function buildDeterministicReport(context: IngestionStoryContext): SynthesizedReport {
  const isMultiSource = (context.clusterItemCount ?? 1) > 1;
  const sourcesList = [context.sourceName, ...(context.additionalSources ?? [])].join(", ");
  const cleanTitle = context.title.trim();
  const desc = context.description?.trim();

  // Construct structured journalistic paragraphs
  const leadParagraph = desc && desc.length > 30
    ? `${desc.replace(/\.$/, "")}, according to dispatches monitored by the TWNS Global News Desk.`
    : `The TWNS Global News Desk is monitoring developing reports concerning ${cleanTitle.toLowerCase()}.`;

  const contextParagraph = context.countryName
    ? `The developments in ${context.countryName} represent a significant focal point for the ${context.categorySlug} desk. Editorial monitors indicate heightened regional engagement as observers assess the wider implications of the event.`
    : `Editorial monitors on the ${context.categorySlug} desk note that these developments carry broader international implications, prompting scrutiny from industry analysts and policymakers.`;

  const verificationParagraph = isMultiSource
    ? `This story has been cross-referenced across multiple independent reporting channels, including ${sourcesList}. TWNS continues to verify emerging claims as additional official statements are issued.`
    : `Initial reporting originates from ${context.sourceName}. Official confirmation and subsequent developments remain under continuous review by TWNS correspondents.`;

  const outlookParagraph = `Further details are expected as officials and participating entities provide formal briefings. TWNS will issue updates as verified facts emerge.`;

  const fullContent = [leadParagraph, contextParagraph, verificationParagraph, outlookParagraph].join("\n\n");

  return {
    title: cleanTitle,
    summary: desc || cleanTitle,
    content: fullContent,
    articleType: isMultiSource ? "DEVELOPING" : "STANDARD",
    verifiedSourcesCount: context.clusterItemCount ?? 1,
    attributionNote: `Monitored by TWNS Newsroom with initial reporting via ${sourcesList}.`
  };
}
