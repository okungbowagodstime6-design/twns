export type PolicyFlag = {
  flagType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
};

const rules: Array<{ flagType: string; severity: PolicyFlag["severity"]; terms: string[]; reason: string }> = [
  { flagType: "POLITICS", severity: "MEDIUM", terms: ["election", "president", "parliament", "government", "minister", "vote"], reason: "Political coverage requires source attribution and editorial context." },
  { flagType: "CONFLICT", severity: "HIGH", terms: ["war", "conflict", "missile", "airstrike", "armed"], reason: "Conflict coverage requires careful verification and harm-aware presentation." },
  { flagType: "CRIME", severity: "HIGH", terms: ["murder", "killed", "crime", "arrested", "police"], reason: "Crime coverage requires presumption of innocence and careful language." },
  { flagType: "HEALTH", severity: "HIGH", terms: ["outbreak", "epidemic", "pandemic", "disease", "hospital"], reason: "Health information can affect public safety and requires responsible sourcing." },
  { flagType: "DISASTER", severity: "HIGH", terms: ["earthquake", "flood", "hurricane", "emergency", "rescue"], reason: "Disaster coverage requires confirmation and sensitivity toward affected people." },
  { flagType: "FINANCE", severity: "MEDIUM", terms: ["market", "bank", "interest rate", "shares", "inflation"], reason: "Financial claims require clear attribution and qualification." },
  { flagType: "ALLEGATION", severity: "HIGH", terms: ["alleged", "allegation", "accused", "claims that"], reason: "Allegations must not be presented as established facts." }
];

export function policyFlags(title: string, description: string | null): PolicyFlag[] {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  return rules
    .filter((rule) => rule.terms.some((term) => text.includes(term)))
    .map(({ flagType, severity, reason }) => ({ flagType, severity, reason }));
}