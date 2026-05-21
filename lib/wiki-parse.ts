import { sanitizeBenefits } from "./infer-plant-benefits.js";

/** Parse plain-text Wikipedia extracts into structured plant fields. */

const COMPANION_SECTION_RE =
  /^(cultivation|companion|intercrop|planting|agriculture|ecology|uses?|growing)/i;
const AVOID_SECTION_RE = /^(toxicity|poison|allelopath|pest|disease|invasive)/i;
const BENEFIT_SECTION_RE =
  /^(nutrition|culinary use|food uses|health|medicinal|phytochemistry)$/i;

function splitWikiSections(extract: string): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = extract.split(/\n={2,}\s*/);
  for (let i = 1; i < parts.length; i++) {
    const match = parts[i].match(/^([^=\n]+)\s*={2,}\s*([\s\S]*)/);
    if (match) {
      sections.set(match[1].trim().toLowerCase(), match[2].trim());
    }
  }
  return sections;
}

function sentencesFromText(text: string, max = 6): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 400);
  return sentences.slice(0, max);
}

function bulletsFromText(text: string): string[] {
  const items: string[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) {
      items.push(t.replace(/^[-*•]\s+/, "").trim());
    }
  }
  return items.filter((s) => s.length > 2 && s.length < 200).slice(0, 8);
}

function findCompanionMentions(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /(?:companion|intercrop(?:ped|ping)?|planted)\s+(?:with|near|alongside)\s+([^.;\n]{3,80})/gi,
    /(?:grows? well (?:with|near|alongside))\s+([^.;\n]{3,80})/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const capture = m[1]?.trim();
      if (!capture) continue;
      const phrase = capture
        .replace(/\s+and\s+/gi, ", ")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      phrase.forEach((p) => found.add(p));
    }
  }
  return [...found].slice(0, 8);
}

function findAvoidMentions(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /(?:avoid|do not plant|not plant)\s+(?:near|with|around)?\s*([^.;\n]{3,80})/gi,
    /(?:allelopath\w*|incompatible)\s+with\s+([^.;\n]{3,80})/gi,
    /(?:toxic to|poisonous to)\s+(?:humans?|pets?|livestock|dogs?|cats?|cattle)/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const capture = m[1]?.trim();
      if (!capture) continue;
      capture
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
        .forEach((s) => found.add(s));
    }
  }
  return [...found].slice(0, 8);
}

export function parseWikipediaExtract(extract: string): {
  benefits: string[];
  companion_plants: string[];
  avoid_planting_near: string[];
} {
  const sections = splitWikiSections(extract);
  const benefits: string[] = [];
  const companions: string[] = [];
  const avoid: string[] = [];

  for (const [title, body] of sections) {
    if (BENEFIT_SECTION_RE.test(title)) {
      const useful = sentencesFromText(body, 5).filter(
        (s) =>
          /vitamin|mineral|nutrit|calor|protein|fiber|antioxid|folate|potassium|iron|calcium|medicinal|edible/i.test(
            s,
          ) && !/reference amount|table\)|daily value, dv\)/i.test(s),
      );
      for (const s of useful) {
        if (/vitamin|mineral|nutrit|calor|protein/i.test(s)) {
          benefits.push(s.replace(/\s*\(table\)\.?$/i, "").trim());
        }
      }
      benefits.push(
        ...bulletsFromText(body).filter((b) =>
          /vitamin|mineral|nutrit|health|edible/i.test(b),
        ),
      );
    }
    if (COMPANION_SECTION_RE.test(title)) {
      companions.push(...bulletsFromText(body));
      companions.push(...findCompanionMentions(body));
    }
    if (AVOID_SECTION_RE.test(title)) {
      avoid.push(...bulletsFromText(body));
      avoid.push(...findAvoidMentions(body));
      const toxSentences = sentencesFromText(body, 4).filter(
        (s) => /toxic|poison|avoid|allelopath|harmful/i.test(s),
      );
      avoid.push(...toxSentences);
    }
  }

  companions.push(...findCompanionMentions(extract));
  avoid.push(...findAvoidMentions(extract));

  return {
    benefits: sanitizeBenefits([...new Set(benefits)]).slice(0, 8),
    companion_plants: [...new Set(companions)].slice(0, 8),
    avoid_planting_near: [...new Set(avoid)].slice(0, 8),
  };
}
