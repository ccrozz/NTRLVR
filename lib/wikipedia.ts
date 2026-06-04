import { sanitizeWikiCareSummary } from "./wiki-text.js";

const WIKI_USER_AGENT =
  "Naturelover/1.0 (Florida food forest plant guide; local educational use)";

export type WikipediaSummary = {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: string | { source?: string; width?: number; height?: number };
  content_urls?: { desktop?: { page?: string } };
};

function thumbnailUrl(
  thumbnail: WikipediaSummary["thumbnail"],
): string | null {
  if (!thumbnail) return null;
  if (typeof thumbnail === "string") return thumbnail;
  return thumbnail.source ?? null;
}

function wikiTitleFromName(name: string): string {
  return name.trim().replace(/\s+/g, "_");
}

async function fetchWikiSummary(title: string): Promise<WikipediaSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT, Accept: "application/json" },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data = (await res.json()) as WikipediaSummary & { type?: string };
  if (data.type === "disambiguation" || !data.extract) return null;
  return data;
}

async function searchWikiTitle(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "opensearch",
    search: query,
    limit: "1",
    namespace: "0",
    format: "json",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;

  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as [string, string[], string[], string[]];
  return json[1]?.[0] ?? null;
}

async function fetchWikiFullExtract(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    titles: title.replace(/ /g, "_"),
    format: "json",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    query?: { pages?: Record<string, { extract?: string }> };
  };
  const pages = json.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.extract ?? null;
}

function wikiSearchQueries(
  scientificName: string,
  commonName: string,
): string[] {
  const sci = scientificName.trim();
  const queries: string[] = [sci];
  const tokens = sci.replace(/×/g, " ").split(/\s+/).filter(Boolean);
  const speciesLevel = tokens.length >= 2 || /×/i.test(sci);
  if (!speciesLevel && tokens[0]?.length > 2) {
    queries.push(tokens[0]);
  }
  const cn = commonName.replace(/\(.*?\)/g, "").trim();
  if (cn.length > 2) queries.push(cn);
  return [...new Set(queries)].filter((q) => q.length > 2);
}

async function resolveWikiTitle(
  scientificName: string,
  commonName: string,
): Promise<{ title: string; summary: WikipediaSummary } | null> {
  const queries = wikiSearchQueries(scientificName, commonName);

  for (const query of queries) {
    let title = wikiTitleFromName(query);
    let summary = await fetchWikiSummary(title);
    if (!summary) {
      const found = await searchWikiTitle(query);
      if (found) {
        title = found;
        summary = await fetchWikiSummary(found);
      }
    }
    if (summary?.extract) return { title: summary.title, summary };
  }
  return null;
}

/** Fetch description + optional image from Wikipedia (API, not HTML scrape). */
export async function fetchWikipediaForPlant(
  scientificName: string,
  commonName: string,
): Promise<{
  care_summary: string | null;
  image_url: string | null;
  source_url: string | null;
  title: string | null;
  full_extract: string | null;
}> {
  const resolved = await resolveWikiTitle(scientificName, commonName);
  if (!resolved) {
    return {
      care_summary: null,
      image_url: null,
      source_url: null,
      title: null,
      full_extract: null,
    };
  }

  const { summary } = resolved;
  const raw = [summary.description, summary.extract]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  const text = sanitizeWikiCareSummary(raw) || null;
  const full_extract = await fetchWikiFullExtract(summary.title);

  return {
    care_summary: text,
    image_url: thumbnailUrl(summary.thumbnail),
    source_url: summary.content_urls?.desktop?.page ?? null,
    title: summary.title,
    full_extract,
  };
}
