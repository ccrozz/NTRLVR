/**
 * Fill native_origin on all plants and refresh benefits (removes false "Florida native" lines).
 * Run: npx tsx scripts/backfill-native-origin.ts
 *
 * Optional: TREFLE_API_KEY set + BACKFILL_ORIGIN_TREFLE=1 fetches distribution for rows with slug (slow).
 */
import { closeDb } from "../db/client.js";
import { listPlants, upsertPlant } from "../db/plant-repository-sqlite.js";
import { enrichPlantNativeOrigin } from "../lib/native-origin.js";
import { loadEnv } from "../lib/load-env.js";

loadEnv();

const FETCH_TREFLE = process.env.BACKFILL_ORIGIN_TREFLE === "1";
const MAX = parseInt(process.env.BACKFILL_ORIGIN_MAX ?? "0", 10) || Infinity;
const PAGE = 150;

async function trefleDetailFor(plant: {
  trefle_slug?: string;
}): Promise<import("../trefle/types.js").TreflePlantDetail | null> {
  const slug = plant.trefle_slug?.trim();
  const token =
    process.env.TREFLE_API_KEY?.trim() ||
    process.env.TREFLE_API_TOKEN?.trim();
  if (!FETCH_TREFLE || !token || !slug || slug.startsWith("local-")) {
    return null;
  }
  try {
    const { TrefleClient } = await import("../trefle/client.js");
    const client = new TrefleClient(token, 400);
    const { data } = await client.fetchPlantBySlug(slug);
    return data;
  } catch {
    return null;
  }
}

let page = 1;
let updated = 0;
let scanned = 0;

for (;;) {
  const { data: plants, total } = listPlants({
    offset: (page - 1) * PAGE,
    limit: PAGE,
  });
  if (!plants.length) break;

  for (const plant of plants) {
    if (scanned >= MAX) break;
    scanned++;

    const detail = await trefleDetailFor(plant);
    const next = enrichPlantNativeOrigin(plant, { trefleDetail: detail });

    const changed =
      next.native_origin !== plant.native_origin ||
      JSON.stringify(next.benefits) !== JSON.stringify(plant.benefits);

    if (!changed) continue;

    upsertPlant(next);
    updated++;
    if (updated <= 30 || updated % 200 === 0) {
      console.log(
        `✓ ${next.common_name}: ${next.native_origin ?? "(no origin text)"}`,
      );
    }
  }

  if (scanned >= MAX || page * PAGE >= total) break;
  page++;
}

console.log(`\nDone. Updated ${updated} of ${scanned} scanned.`);
closeDb();
