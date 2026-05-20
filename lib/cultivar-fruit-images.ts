/**
 * Fruit-focused thumbnails for tomato / pepper / squash cultivars.
 * Prefers ripe fruit, harvest, and sliced produce — not whole-plant or flower shots.
 */
import {
  isRejectedWikimediaFileTitle,
  type ImageSource,
  type PlantImageResult,
} from "./plant-images.js";

const UA =
  "Naturelover/1.0 (Florida food forest; educational; +https://github.com/local)";

export type CropKind = "tomato" | "pepper" | "squash";

const MIN_FRUIT_SCORE = 14;

type PhotoCandidate = {
  url: string;
  attribution?: string;
  score: number;
  source: ImageSource;
};

const FRUIT_STRONG =
  /\b(fruit|fruits|berry|berries|ripe|ripening|harvest|harvested|picked|market|sliced|slice|cross[\s-]?section|interior|flesh|produce|edible|grocery|basket)\b/i;
const CROP_FRUIT =
  /\b(tomato|tomatoes|pepper|peppers|chili|chile|jalapeño|jalapeno|habanero|capsicum|squash|zucchini|pumpkin|gourd|calabaza|calabash|butternut|acorn squash|spaghetti squash|chayote)\b/i;
const NON_FRUIT =
  /\b(flower|flowers|bloom|blossom|inflorescence|leaf|leaves|foliage|stem|stems|vine|tendril|seedling|sapling|whole plant|plant habit|field row|habitat|landscape|herbarium|diagram|pollinator|bee on)\b/i;
/** Cultivar name in filename but subject is not produce (e.g. military "Cherry Bomb"). */
const WIKI_FALSE_CULTIVAR =
  /\b(parks?|monument|memorial|artillery|cannon|statue|plaque|cemetery|military|naval|war memorial)\b/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function upgradeInatPhotoUrl(url: string): string {
  return url
    .replace(/\/square\.(jpg|jpeg|png|webp)/i, "/large.$1")
    .replace(/\/medium\.(jpg|jpeg|png|webp)/i, "/large.$1")
    .replace(/\/small\.(jpg|jpeg|png|webp)/i, "/large.$1");
}

function hashPlantId(plantId: string): number {
  let h = 0;
  for (let i = 0; i < plantId.length; i++) {
    h = (Math.imul(31, h) + plantId.charCodeAt(i)) >>> 0;
  }
  return h;
}

function cropKindFromId(id: string): CropKind | null {
  if (id.startsWith("tomato-")) return "tomato";
  if (id.startsWith("pepper-")) return "pepper";
  if (id.startsWith("squash-") || id === "seminole-pumpkin") return "squash";
  return null;
}

function parseCultivarLabel(
  commonName: string,
  crop: CropKind,
): string {
  const base = commonName.replace(/\(.*?\)/g, "").trim();
  if (crop === "tomato") return base.replace(/\s+tomato$/i, "").trim();
  if (crop === "pepper") return base.replace(/\s+pepper$/i, "").trim();
  return base.replace(/\s+(squash|pumpkin)$/i, "").trim();
}

function cultivarInText(text: string, cultivar: string): boolean {
  if (!cultivar.trim()) return false;
  const lower = text.toLowerCase();
  const compact = cultivar.toLowerCase().replace(/[^a-z0-9]/g, "");
  const underscored = cultivar.toLowerCase().replace(/\s+/g, "_");
  return (
    lower.includes(cultivar.toLowerCase()) ||
    (compact.length >= 4 && lower.replace(/[^a-z0-9]/g, "").includes(compact)) ||
    lower.includes(underscored)
  );
}

function scoreFruitContext(
  text: string,
  cultivar: string,
  crop: CropKind,
  scientificName = "",
): number {
  const lower = text.toLowerCase();
  let score = 0;
  if (FRUIT_STRONG.test(lower)) score += 14;
  if (CROP_FRUIT.test(lower)) score += 6;
  if (/\bripe\b/i.test(lower)) score += 8;
  if (/\bfruit\b/i.test(lower)) score += 10;
  if (NON_FRUIT.test(lower)) score -= 18;

  if (cultivarInText(lower, cultivar)) {
    score += cultivar.split(/\s+/).length >= 2 ? 20 : 12;
  } else if (
    /starr-\d+.*solanum_lycopersicum|solanum_lycopersicum.*fruit/i.test(lower) &&
    crop === "tomato"
  ) {
    score -= 10;
  }
  if (scientificName) {
    const sn = scientificName.toLowerCase();
    if (lower.includes(sn.replace(/\s+/g, "_"))) score += 8;
    if (lower.includes(sn.split(" ")[0] ?? "")) score += 4;
  }
  if (crop === "tomato" && /\btomato\b/i.test(lower)) score += 4;
  if (crop === "pepper" && /\b(pepper|chili|chile|capsicum)\b/i.test(lower)) {
    score += 4;
  }
  if (crop === "squash" && /\b(squash|pumpkin|gourd|zucchini)\b/i.test(lower)) {
    score += 4;
  }
  if (crop === "squash" && /\b(cucurbita|moschata|pepo|maxima|butternut|calabaza)\b/i.test(lower)) {
    score += 10;
  }
  return score;
}

function fruitSearchQueries(
  cultivar: string,
  crop: CropKind,
  commonName: string,
): string[] {
  const base = commonName.replace(/\(.*?\)/g, "").trim();
  const cropWord =
    crop === "squash" && /pumpkin/i.test(commonName) ? "pumpkin" : crop;
  const out = new Set<string>([
    `${cultivar} ${cropWord} fruit`,
    `${cultivar} ${cropWord} ripe fruit`,
    `${cultivar} ripe ${cropWord}`,
    `${base} fruit`,
    `${cultivar} fruit`,
    `${cultivar} harvest`,
  ]);
  if (crop === "pepper") {
    out.add(`${cultivar} hot pepper fruit`);
    out.add(`${cultivar} chili pepper`);
    if (/bomb/i.test(cultivar)) {
      out.add("cherry pepper fruit Capsicum annuum");
      out.add("Kirschpaprika Capsicum");
    }
  }
  if (crop === "squash") {
    out.add(`${cultivar} squash fruit`);
    out.add(`${cultivar} sliced squash`);
    out.add(`${cultivar} pumpkin fruit`);
    if (/seminole/i.test(cultivar)) {
      out.add("Seminole pumpkin Florida fruit");
      out.add("Cucurbita moschata pumpkin fruit");
    }
  }
  return [...out].filter((q) => q.length >= 5).slice(0, 7);
}

function wikimediaFruitQueries(
  cultivar: string,
  crop: CropKind,
  commonName: string,
  scientificName: string,
): string[] {
  const base = commonName.replace(/\(.*?\)/g, "").trim();
  const cropWord =
    crop === "squash" && /pumpkin/i.test(commonName) ? "pumpkin" : crop;
  if (!cultivar.trim()) {
    return [
      `${base} fruit`,
      `${scientificName} fruit`,
      `${scientificName} ${cropWord} fruit`,
      `winter ${cropWord} fruit cut`,
    ].filter((q) => q.length >= 4);
  }
  return [
    `${cultivar} ${cropWord} fruit`,
    `${base} fruit`,
    `${scientificName} fruit`,
    `${cultivar} ${cropWord}`,
  ].filter((q) => q.length >= 4);
}

function photoFromUrl(
  url: string,
  attribution: string | undefined,
  score: number,
  source: ImageSource,
): PhotoCandidate | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (/\.svg$/i.test(url)) return null;
  return {
    url: source === "inaturalist" ? upgradeInatPhotoUrl(url) : url,
    attribution,
    score,
    source,
  };
}

function pickFruitCandidate(
  candidates: PhotoCandidate[],
  plantId: string,
  minScore: number,
): PhotoCandidate | null {
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return c.score >= minScore;
  });
  if (!unique.length) return null;

  unique.sort((a, b) => b.score - a.score);
  const max = unique[0]!.score;
  const tier = unique.filter((c) => c.score >= max - 5);
  const pick = tier[hashPlantId(plantId) % tier.length] ?? tier[0]!;
  return pick;
}

async function inatFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
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

type InatTaxon = { id: number; name: string };

async function resolveInatTaxon(scientificName: string): Promise<InatTaxon | null> {
  const q = scientificName
    .replace(/^[×x]\s*/gi, "")
    .replace(/\s*[×x]\s*/gi, " ")
    .trim();
  const json = await inatFetch<{ results?: InatTaxon[] }>("taxa", {
    q,
    rank: "species",
    per_page: "6",
    is_active: "true",
    order_by: "observations_count",
    order: "desc",
  });
  const target = q.toLowerCase();
  const results = json?.results ?? [];
  return (
    results.find((t) => t.name?.toLowerCase() === target) ??
    results.find((t) => t.name?.toLowerCase().startsWith(target.split(" ")[0] ?? "")) ??
    results[0] ??
    null
  );
}

type InatObservation = {
  description?: string;
  taxon?: {
    name?: string;
    preferred_common_name?: string;
    iconic_taxon_name?: string;
  };
  photos?: {
    url?: string;
    original_url?: string;
    large_url?: string;
    medium_url?: string;
    attribution?: string;
  }[];
};

function observationsToFruitCandidates(
  observations: InatObservation[],
  cultivar: string,
  crop: CropKind,
  commonName: string,
  boost: number,
  scientificName = "",
): PhotoCandidate[] {
  const out: PhotoCandidate[] = [];
  for (const obs of observations) {
    const context = [
      obs.description ?? "",
      obs.taxon?.name ?? "",
      obs.taxon?.preferred_common_name ?? "",
      commonName,
    ].join(" ");
    const score =
      scoreFruitContext(context, cultivar, crop, scientificName) +
      boost +
      (obs.taxon?.iconic_taxon_name === "Plantae" ? 2 : 0);
    for (const photo of obs.photos ?? []) {
      const url =
        photo.original_url ??
        photo.large_url ??
        photo.url ??
        photo.medium_url;
      const c = photoFromUrl(url ?? "", photo.attribution, score, "inaturalist");
      if (c) out.push(c);
    }
  }
  return out;
}

async function fetchInatCultivarFruitCandidates(
  cultivar: string,
  crop: CropKind,
  commonName: string,
  scientificName: string,
): Promise<PhotoCandidate[]> {
  const taxon = await resolveInatTaxon(scientificName);
  const queries = fruitSearchQueries(cultivar, crop, commonName);
  const out: PhotoCandidate[] = [];

  for (const q of queries) {
    const params: Record<string, string> = {
      q,
      quality_grade: "research",
      photos: "true",
      per_page: "20",
      order_by: "votes",
      order: "desc",
      photo_license: "cc0,cc-by,cc-by-sa",
      iconic_taxa: "Plantae",
    };
    if (taxon?.id) params.taxon_id = String(taxon.id);

    const json = await inatFetch<{ results?: InatObservation[] }>(
      "observations",
      params,
    );
    out.push(
      ...observationsToFruitCandidates(
        json?.results ?? [],
        cultivar,
        crop,
        commonName,
        8,
        scientificName,
      ),
    );
    await sleep(90);
  }
  return out;
}

async function fetchInatSpeciesFruitCandidates(
  scientificName: string,
  cultivar: string,
  crop: CropKind,
  commonName: string,
): Promise<PhotoCandidate[]> {
  const taxon = await resolveInatTaxon(scientificName);
  if (!taxon) return [];

  const json = await inatFetch<{ results?: InatObservation[] }>("observations", {
    taxon_id: String(taxon.id),
    q: "fruit ripe harvest",
    quality_grade: "research",
    photos: "true",
    per_page: "40",
    order_by: "votes",
    order: "desc",
    photo_license: "cc0,cc-by,cc-by-sa",
  });
  return observationsToFruitCandidates(
    json?.results ?? [],
    cultivar,
    crop,
    commonName,
    4,
    scientificName,
  );
}

async function fetchWikimediaFruitCandidates(
  cultivar: string,
  crop: CropKind,
  commonName: string,
  scientificName: string,
): Promise<PhotoCandidate[]> {
  const searches = wikimediaFruitQueries(
    cultivar,
    crop,
    commonName,
    scientificName,
  );
  const out: PhotoCandidate[] = [];

  for (const term of searches) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: term,
      gsrnamespace: "6",
      gsrlimit: "12",
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
          { title?: string; imageinfo?: { url?: string; mime?: string }[] }
        >;
      };
    };

    for (const page of Object.values(json.query?.pages ?? {})) {
      const title = page.title ?? "";
      if (isRejectedWikimediaFileTitle(title)) continue;
      const info = page.imageinfo?.[0];
      if (!info?.url || !(info.mime ?? "").startsWith("image/")) continue;
      if (/\.svg$/i.test(info.url)) continue;
      if (/icon|logo|map|diagram|range|distribution|flower|leaf|foliage/i.test(title)) {
        continue;
      }
      if (cultivarInText(title, cultivar) && WIKI_FALSE_CULTIVAR.test(title)) {
        continue;
      }
      let score =
        scoreFruitContext(title, cultivar, crop, scientificName) +
        (/\bfruit\b/i.test(title) ? 12 : 0) +
        (term.includes("fruit") ? 6 : 0);
      if (
        cultivarInText(title, cultivar) &&
        !FRUIT_STRONG.test(title) &&
        !/\b(paprika|pepper|chili|chile|capsicum)\b/i.test(title)
      ) {
        score -= 20;
      }
      const c = photoFromUrl(
        info.url,
        title.replace(/^File:/, "") || "Wikimedia Commons",
        score,
        "wikimedia",
      );
      if (c) out.push(c);
    }
    await sleep(80);
  }
  return out;
}

/** Fruit-first image for VH021-style cultivar rows. */
export async function fetchCultivarFruitImage(
  plantId: string,
  commonName: string,
  scientificName: string,
): Promise<PlantImageResult | null> {
  const crop = cropKindFromId(plantId);
  if (!crop) return null;

  const cultivar = parseCultivarLabel(commonName, crop);
  if (!cultivar) return null;

  const candidates: PhotoCandidate[] = [
    ...(await fetchInatCultivarFruitCandidates(
      cultivar,
      crop,
      commonName,
      scientificName,
    )),
  ];

  let best = pickFruitCandidate(candidates, plantId, MIN_FRUIT_SCORE);
  if (best) {
    return {
      image_url: best.url,
      source: best.source,
      attribution: best.attribution,
    };
  }

  await sleep(120);
  candidates.push(
    ...(await fetchWikimediaFruitCandidates(
      cultivar,
      crop,
      commonName,
      scientificName,
    )),
  );
  best = pickFruitCandidate(candidates, plantId, MIN_FRUIT_SCORE);
  if (best) {
    return {
      image_url: best.url,
      source: best.source,
      attribution: best.attribution,
    };
  }

  await sleep(120);
  candidates.push(
    ...(await fetchInatSpeciesFruitCandidates(
      scientificName,
      cultivar,
      crop,
      commonName,
    )),
  );
  best = pickFruitCandidate(candidates, plantId, MIN_FRUIT_SCORE - 4);
  if (best) {
    return {
      image_url: best.url,
      source: best.source,
      attribution: best.attribution,
    };
  }

  if (crop === "squash") {
    candidates.push(
      ...(await fetchWikimediaFruitCandidates(
        "",
        crop,
        `${scientificName} squash fruit`,
        scientificName,
      )),
    );
    best = pickFruitCandidate(candidates, plantId, 10);
    if (best) {
      return {
        image_url: best.url,
        source: best.source,
        attribution: best.attribution,
      };
    }
  }

  return null;
}
