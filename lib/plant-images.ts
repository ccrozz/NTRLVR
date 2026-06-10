/**
 * Resolve plant photos from public APIs (no HTML scraping).
 * Default order: iNaturalist (research-grade) → Wikimedia Commons → Wikipedia.
 * Unsplash is opt-in only (ALLOW_UNSPLASH=true) — often generic vs botanical IDs.
 */
import { isRejectedPlantImageUrl } from "./plant-image-quality.js";
import { fetchWikipediaForPlant } from "./wikipedia.js";

const UA =
  "Naturelover/1.0 (Florida food forest; educational; +https://github.com/local)";

export type ImageSource = "unsplash" | "inaturalist" | "wikimedia" | "wikipedia";

export type PlantImageResult = {
  image_url: string;
  source: ImageSource;
  attribution?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function upgradeInatPhotoUrl(url: string): string {
  return url
    .replace(/\/square\.(jpg|jpeg|png|webp)/i, "/large.$1")
    .replace(/\/medium\.(jpg|jpeg|png|webp)/i, "/large.$1")
    .replace(/\/small\.(jpg|jpeg|png|webp)/i, "/large.$1");
}

function upgradeWikiThumb(url: string): string {
  return url.replace(/\/(\d+)px-/, "/1200px-");
}

type InatPhotoCandidate = {
  url: string;
  attribution?: string;
  score: number;
};

const PREFER_TERMS =
  /\b(fruit|berry|ripe|harvest|flower|bloom|inflorescence|leaf|foliage|garden|cultivat|edible|produce|pod|pepper|tomato|squash|gourd|melon|citrus|blossom|flowering)\b/i;
const AVOID_TERMS =
  /\b(landscape|habitat|national park|trail|sign|map|diagram|bird|mammal|deer|insect on|pollinator on|museum|herbarium sheet)\b/i;

/** Wikimedia filenames that match cultivar words but are not plants (e.g. "Pepper Parks & Cherry Bomb"). */
const WIKIMEDIA_NON_PLANT_TITLE =
  /\b(parks?|monument|memorial|museum|artillery|cannon|statue|plaque|cemetery|military|naval|war memorial|historic site|seed catalog|nursery catalog)\b|\.pdf$/i;

/** Musical instruments and other homonyms for plant genera (Viola → Bratsche/violin). */
const WIKIMEDIA_INSTRUMENT_TITLE =
  /\b(bratsche|violin|viola scroll|cello|contrabass|double bass|fiddle|mandolin|guitar|piano|harp|trumpet|saxophone|clarinet|flute|oboe|bassoon|trombone|drum kit|synthesizer)\b/i;

export function isRejectedWikimediaFileTitle(title: string): boolean {
  const t = title.replace(/^File:/i, "");
  if (/icon|logo|map|diagram|range|distribution/i.test(t)) return true;
  if (WIKIMEDIA_INSTRUMENT_TITLE.test(t)) return true;
  return WIKIMEDIA_NON_PLANT_TITLE.test(t);
}

export { isRejectedPlantImageUrl } from "./plant-image-quality.js";

function scoreWikimediaFileTitle(
  title: string,
  scientificName: string,
  commonName: string,
): number {
  const t = title.replace(/^File:/i, "");
  if (isRejectedWikimediaFileTitle(title)) return -99;
  let score = 0;
  if (PREFER_TERMS.test(t)) score += 8;
  if (AVOID_TERMS.test(t)) score -= 12;
  if (/\bfruit\b/i.test(t)) score += 14;
  if (/\b(pepper|chili|chile|capsicum|tomato|squash|plant)\b/i.test(t)) score += 6;
  const sn = scientificName.trim().toLowerCase();
  const snUnderscore = sn.replace(/\s+/g, "_");
  const tLower = t.toLowerCase();
  if (sn && tLower.includes(snUnderscore)) score += 10;
  const common = commonName.replace(/\(.*?\)/g, "").trim().toLowerCase();
  if (common.length >= 4 && tLower.includes(common.replace(/\s+/g, "_"))) {
    score += 8;
  }
  // Genus-only overlap (e.g. "Viola" in instrument filenames) is not enough.
  const genus = sn.split(/\s+/)[0] ?? "";
  if (
    genus.length >= 4 &&
    tLower.includes(genus) &&
    !tLower.includes(snUnderscore) &&
    !PREFER_TERMS.test(t)
  ) {
    score -= 10;
  }
  return score;
}

function scorePhotoContext(text: string, iconicTaxon?: string): number {
  let score = 0;
  if (iconicTaxon === "Plantae" || iconicTaxon === "Fungi") score += 4;
  if (PREFER_TERMS.test(text)) score += 6;
  if (AVOID_TERMS.test(text)) score -= 8;
  return score;
}

function photoFromInatUrl(
  url: string,
  attribution?: string,
  baseScore = 0,
): InatPhotoCandidate | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (/\.svg$/i.test(url)) return null;
  return {
    url: upgradeInatPhotoUrl(url),
    attribution,
    score: baseScore,
  };
}

async function inatFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`https://api.inaturalist.org/v1/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

type InatTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string;
  matched_term?: string;
  default_photo?: {
    url?: string;
    original_url?: string;
    large_url?: string;
    medium_url?: string;
    attribution?: string;
  };
  taxon_photos?: { photo?: { url?: string; attribution?: string } }[];
};

function pickBestTaxon(results: InatTaxon[], scientificName: string): InatTaxon | null {
  if (!results.length) return null;
  const target = scientificName.trim().toLowerCase();
  const exact = results.find((t) => t.name?.toLowerCase() === target);
  if (exact) return exact;
  const startsWith = results.find((t) => t.name?.toLowerCase().startsWith(target));
  return startsWith ?? results[0] ?? null;
}

function collectTaxonPhotoCandidates(taxon: InatTaxon): InatPhotoCandidate[] {
  const out: InatPhotoCandidate[] = [];
  const dp = taxon.default_photo;
  if (dp) {
    const url =
      dp.original_url ??
      dp.large_url ??
      dp.url?.replace("/square.", "/large.") ??
      dp.medium_url;
    const c = photoFromInatUrl(url ?? "", dp.attribution, 10);
    if (c) out.push(c);
  }
  for (const tp of taxon.taxon_photos ?? []) {
    const c = photoFromInatUrl(tp.photo?.url ?? "", tp.photo?.attribution, 8);
    if (c) out.push(c);
  }
  return out;
}

type InatObservation = {
  id: number;
  description?: string;
  taxon?: { name?: string; preferred_common_name?: string; iconic_taxon_name?: string };
  photos?: {
    url?: string;
    original_url?: string;
    large_url?: string;
    medium_url?: string;
    attribution?: string;
  }[];
};

async function collectObservationPhotoCandidates(
  taxonId: number,
  commonName: string,
): Promise<InatPhotoCandidate[]> {
  const json = await inatFetch<{ results?: InatObservation[] }>("observations", {
    taxon_id: String(taxonId),
    quality_grade: "research",
    photos: "true",
    per_page: "30",
    order_by: "votes",
    order: "desc",
    photo_license: "cc0,cc-by,cc-by-sa",
  });
  const out: InatPhotoCandidate[] = [];
  for (const obs of json?.results ?? []) {
    const context = [
      obs.description ?? "",
      obs.taxon?.name ?? "",
      obs.taxon?.preferred_common_name ?? "",
      commonName,
    ].join(" ");
    const base = scorePhotoContext(context, obs.taxon?.iconic_taxon_name);
    for (const photo of obs.photos ?? []) {
      const url =
        photo.original_url ??
        photo.large_url ??
        photo.url ??
        photo.medium_url;
      const c = photoFromInatUrl(url ?? "", photo.attribution, base + 5);
      if (c) out.push(c);
    }
  }
  return out;
}

function pickBestCandidate(candidates: InatPhotoCandidate[]): InatPhotoCandidate | null {
  if (!candidates.length) return null;
  const seen = new Set<string>();
  let best: InatPhotoCandidate | null = null;
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    if (!best || c.score > best.score) best = c;
  }
  return best;
}

/** iNaturalist — species match + ranked research-grade observation photos. */
export async function fetchINaturalistPlantImage(
  scientificName: string,
  commonName = "",
): Promise<PlantImageResult | null> {
  const taxaJson = await inatFetch<{ results?: InatTaxon[] }>("taxa", {
    q: scientificName.trim(),
    rank: "species",
    per_page: "8",
    is_active: "true",
    order_by: "observations_count",
    order: "desc",
  });
  const taxon = pickBestTaxon(taxaJson?.results ?? [], scientificName);
  if (!taxon) return null;

  const candidates: InatPhotoCandidate[] = [
    ...collectTaxonPhotoCandidates(taxon),
    ...(await collectObservationPhotoCandidates(taxon.id, commonName)),
  ];
  const best = pickBestCandidate(candidates);
  if (!best) return null;

  return acceptPlantImageResult({
    image_url: best.url,
    source: "inaturalist",
    attribution: best.attribution,
  });
}

/** Unsplash Search API — opt-in only via ALLOW_UNSPLASH. */
export async function fetchUnsplashPlantImage(
  commonName: string,
  _scientificName?: string,
): Promise<PlantImageResult | null> {
  if (process.env.ALLOW_UNSPLASH !== "true") return null;

  const key =
    process.env.UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_CLIENT_ID;
  if (!key) return null;

  const query = [commonName.replace(/\(.*?\)/g, "").trim(), "plant"]
    .filter(Boolean)
    .join(" ");
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    results?: {
      urls?: { regular?: string; full?: string };
      user?: { name?: string };
    }[];
  };
  const hit = json.results?.[0];
  const image = hit?.urls?.regular ?? hit?.urls?.full ?? null;
  if (!image) return null;

  const photographer = hit?.user?.name;
  return {
    image_url: image,
    source: "unsplash",
    attribution: photographer
      ? `Photo by ${photographer} on Unsplash`
      : "Unsplash",
  };
}

/** Wikimedia Commons — fallback when iNaturalist has no usable photo. */
export async function fetchWikimediaCommonsPlantImage(
  scientificName: string,
  commonName: string,
): Promise<PlantImageResult | null> {
  const searches = [
    `${scientificName} fruit`,
    scientificName,
    `${commonName.replace(/\(.*?\)/g, "").trim()} plant`,
  ];

  for (const term of searches) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: term,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "1600",
      format: "json",
      origin: "*",
    });

    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) continue;

    const json = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            imageinfo?: { url?: string; mime?: string }[];
          }
        >;
      };
    };

    let best: { url: string; title: string; score: number } | null = null;
    for (const page of Object.values(json.query?.pages ?? {})) {
      const title = page.title ?? "";
      if (isRejectedWikimediaFileTitle(title)) continue;
      const info = page.imageinfo?.[0];
      const mime = info?.mime ?? "";
      if (!info?.url) continue;
      if (!mime.startsWith("image/")) continue;
      if (/\.svg$/i.test(info.url)) continue;
      const score = scoreWikimediaFileTitle(title, scientificName, commonName);
      if (score < 8) continue;
      if (!best || score > best.score) {
        best = { url: info.url, title, score };
      }
    }
    if (best) {
      return acceptPlantImageResult({
        image_url: best.url,
        source: "wikimedia",
        attribution: best.title.replace(/^File:/, "") || "Wikimedia Commons",
      });
    }
  }
  return null;
}

export async function fetchWikipediaPlantImage(
  scientificName: string,
  commonName: string,
): Promise<PlantImageResult | null> {
  const wiki = await fetchWikipediaForPlant(scientificName, commonName);
  if (!wiki.image_url || isRejectedPlantImageUrl(wiki.image_url)) return null;
  return {
    image_url: upgradeWikiThumb(wiki.image_url),
    source: "wikipedia",
    attribution: wiki.title ? `Wikipedia: ${wiki.title}` : "Wikipedia",
  };
}

function acceptPlantImageResult(
  result: PlantImageResult | null,
): PlantImageResult | null {
  if (!result || isRejectedPlantImageUrl(result.image_url)) return null;
  return result;
}

/** iNaturalist first; Wikimedia/Wikipedia only as fallback. */
export async function fetchBestPlantImage(
  commonName: string,
  scientificName: string,
): Promise<PlantImageResult | null> {
  const inat = acceptPlantImageResult(
    await fetchINaturalistPlantImage(scientificName, commonName),
  );
  if (inat) return inat;

  await sleep(250);
  const commons = acceptPlantImageResult(
    await fetchWikimediaCommonsPlantImage(scientificName, commonName),
  );
  if (commons) return commons;

  await sleep(250);
  return fetchWikipediaPlantImage(scientificName, commonName);
}

/** Only iNaturalist (no Wikimedia/Unsplash). */
export async function fetchInaturalistOnlyPlantImage(
  commonName: string,
  scientificName: string,
): Promise<PlantImageResult | null> {
  return fetchINaturalistPlantImage(scientificName, commonName);
}

export function isInaturalistImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("inaturalist.org") ||
    url.includes("inaturalist-open-data.s3.amazonaws.com")
  );
}
