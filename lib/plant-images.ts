/**
 * Resolve plant photos from public APIs (no HTML scraping).
 * Order: Unsplash (if keyed) → iNaturalist → Wikimedia Commons → Wikipedia thumb.
 */
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

function upgradeWikiThumb(url: string): string {
  return url.replace(/\/(\d+)px-/, "/1200px-");
}

/** Unsplash Search API — https://unsplash.com/developers */
export async function fetchUnsplashPlantImage(
  commonName: string,
  scientificName?: string,
): Promise<PlantImageResult | null> {
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
      user?: { name?: string; links?: { html?: string } };
      links?: { html?: string };
    }[];
  };
  const hit = json.results?.[0];
  const image =
    hit?.urls?.regular ?? hit?.urls?.full ?? null;
  if (!image) return null;

  const photographer = hit.user?.name;
  return {
    image_url: image,
    source: "unsplash",
    attribution: photographer
      ? `Photo by ${photographer} on Unsplash`
      : "Unsplash",
  };
}

/** iNaturalist taxon photos — strong match on scientific names. */
export async function fetchINaturalistPlantImage(
  scientificName: string,
): Promise<PlantImageResult | null> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("q", scientificName);
  url.searchParams.set("rank", "species");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("is_active", "true");
  url.searchParams.set("order_by", "observations_count");
  url.searchParams.set("order", "desc");

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    results?: {
      default_photo?: {
        url?: string;
        original_url?: string;
        large_url?: string;
        medium_url?: string;
        attribution?: string;
      };
    }[];
  };

  const photo = json.results?.[0]?.default_photo;
  if (!photo) return null;

  const image =
    photo.original_url ??
    photo.large_url ??
    photo.url?.replace("/square.", "/large.") ??
    photo.medium_url ??
    null;
  if (!image) return null;

  return {
    image_url: image,
    source: "inaturalist",
    attribution: photo.attribution ?? undefined,
  };
}

/** Wikimedia Commons — high-resolution botanical images. */
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
            imageinfo?: { url?: string; thumburl?: string; mime?: string }[];
          }
        >;
      };
    };

    const pages = Object.values(json.query?.pages ?? {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const mime = info?.mime ?? "";
      if (!info?.url) continue;
      if (!mime.startsWith("image/")) continue;
      if (/\.svg$/i.test(info.url)) continue;
      if (/icon|logo|map|diagram|range|distribution/i.test(page.title ?? "")) {
        continue;
      }
      return {
        image_url: info.url,
        source: "wikimedia",
        attribution: page.title?.replace(/^File:/, "") ?? "Wikimedia Commons",
      };
    }
  }
  return null;
}

export async function fetchWikipediaPlantImage(
  scientificName: string,
  commonName: string,
): Promise<PlantImageResult | null> {
  const wiki = await fetchWikipediaForPlant(scientificName, commonName);
  if (!wiki.image_url) return null;
  return {
    image_url: upgradeWikiThumb(wiki.image_url),
    source: "wikipedia",
    attribution: wiki.title ? `Wikipedia: ${wiki.title}` : "Wikipedia",
  };
}

/** Try all sources; prefers Unsplash when API key is set. */
export async function fetchBestPlantImage(
  commonName: string,
  scientificName: string,
): Promise<PlantImageResult | null> {
  const unsplash = await fetchUnsplashPlantImage(commonName, scientificName);
  if (unsplash) return unsplash;

  await sleep(200);
  const inat = await fetchINaturalistPlantImage(scientificName);
  if (inat) return inat;

  await sleep(200);
  const commons = await fetchWikimediaCommonsPlantImage(
    scientificName,
    commonName,
  );
  if (commons) return commons;

  await sleep(200);
  return fetchWikipediaPlantImage(scientificName, commonName);
}
