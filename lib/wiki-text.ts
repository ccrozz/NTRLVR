/** Detect / trim raw Wikipedia dumps unfit for UI fields. */

const WIKI_SECTION_RE = /={2,}\s*[A-Za-z][\w\s/]+\s*={2,}/;
const WIKI_RULE_RE = /\n-{3,}\n/;

export function isWikiDump(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length > 160) return true;
  if (WIKI_SECTION_RE.test(t)) return true;
  if (WIKI_RULE_RE.test(t)) return true;
  if (
    t.length > 70 &&
    t === t.toUpperCase() &&
    /[A-Z]{5,}/.test(t) &&
    !/^NATIVE TO /i.test(t)
  ) {
    return true;
  }
  return false;
}

/** Short catalog care blurb from Wikipedia REST summary only. */
export function sanitizeWikiCareSummary(text: string): string {
  let t = text
    .replace(WIKI_SECTION_RE, " ")
    .replace(/\n-{3,}\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || isWikiDump(t)) return "";

  const sentences = t
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 400);
  t = (sentences.slice(0, 2).join(" ") || t).trim();
  if (t.length > 480) {
    t = t.slice(0, 477).replace(/\s+\S*$/, "").trim() + "…";
  }
  return t;
}

/** One-line native range label for badges (not full articles). */
/** Readable paragraphs for expanded benefit / wiki text in the catalog UI. */
export function formatBenefitExpandedText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/={2,}\s*([^=\n]+?)\s*={2,}/g, "\n\n$1\n")
    .replace(/\n-{3,}\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/  +/g, " ")
    .trim();
}

export const EXPANDABLE_BENEFIT_MIN_LEN = 160;

export function isExpandableBenefit(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return t.length >= EXPANDABLE_BENEFIT_MIN_LEN || isWikiDump(t);
}

export function shortenNativeOriginBadge(text: string, max = 56): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
}
