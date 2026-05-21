/**
 * Legacy Trefle-focused state import. Prefer open-web harvest:
 *   npm run harvest:web:both
 *
 * This script:
 * 1) Upsert curated state seeds into SQLite
 * 2) Paginate Trefle.io for edible plants that grow in each state's zones
 * 3) Optional: enrich metadata (USDA natives, zones, Wikipedia)
 * 4) Optional: fetch iNaturalist / Wikimedia photos
 *
 * Usage:
 *   npx tsx scripts/import-state-catalog.ts --state=TN
 *   npx tsx scripts/import-state-catalog.ts --state=CT
 *   npx tsx scripts/import-state-catalog.ts --state=both
 *   npx tsx scripts/import-state-catalog.ts --state=TN --trefle --max-requests=500
 *   npx tsx scripts/import-state-catalog.ts --state=both --seeds --enrich --images
 *
 * Requires TREFLE_API_TOKEN in .env for --trefle / --enrich Trefle merge.
 */
import { loadEnv } from "../lib/load-env.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import {
  countPlants,
  getPlantById,
  rowToPlant,
  upsertPlant,
} from "../db/plant-repository-sqlite.js";
import { getDb } from "../db/client.js";
import {
  enrichStatePlantRow,
  fetchImageForPlant,
  importTrefleCatalogForState,
  summarizeStateImport,
  tagPlantForState,
} from "../lib/state-plant-import.js";
import {
  mergeLocalWithTrefle,
  searchTrefleByScientificName,
} from "../lib/trefle-api.js";
import { mapDetailToPlant } from "../trefle/map-plant.js";

loadEnv();

const args = process.argv.slice(2);
const stateArg =
  args.find((a) => a.startsWith("--state="))?.split("=")[1]?.toUpperCase() ??
  "both";
const maxRequests = parseInt(
  args.find((a) => a.startsWith("--max-requests="))?.split("=")[1] ?? "200",
  10,
);
const runSeeds = args.includes("--seeds") || !args.includes("--trefle-only");
const runTrefle = args.includes("--trefle") || args.includes("--all");
const runEnrich = args.includes("--enrich");
const runImages = args.includes("--images");
const fetchDetails =
  args.includes("--details") || process.env.TREFLE_FETCH_DETAILS === "true";
const edibleOnly = !args.includes("--all-plants");
const enrichDelay = parseInt(process.env.IMPORT_ENRICH_DELAY_MS ?? "350", 10);
const imageDelay = parseInt(process.env.IMAGE_FETCH_DELAY_MS ?? "500", 10);

function statesToRun(): DesignerStateCode[] {
  if (stateArg === "BOTH") return ["TN", "CT"];
  if (stateArg === "TN" || stateArg === "CT") return [stateArg];
  console.error("Use --state=TN, --state=CT, or --state=both");
  process.exit(1);
}

async function syncCuratedSeeds(stateCode: DesignerStateCode) {
  const seeds = designerSeedsForState(stateCode);
  let n = 0;
  for (const plant of seeds) {
    const row = tagPlantForState(plant, stateCode);
    const existing = getPlantById(row.id);
    if (existing?.image_url?.trim() && !row.image_url?.trim()) {
      upsertPlant({ ...row, image_url: existing.image_url });
    } else {
      upsertPlant(row);
    }
    n++;
  }
  console.log(`  Curated seeds upserted: ${n}`);
}

async function enrichSeedsFromTrefle(stateCode: DesignerStateCode) {
  const token = process.env.TREFLE_API_TOKEN?.trim();
  if (!token) {
    console.log("  (skip Trefle seed enrich — no TREFLE_API_TOKEN)");
    return;
  }
  const seeds = designerSeedsForState(stateCode);
  let enriched = 0;
  for (const plant of seeds) {
    try {
      const detail = await searchTrefleByScientificName(plant.scientific_name);
      if (!detail) continue;
      const mapped = mapDetailToPlant(detail);
      const merged = tagPlantForState(
        mergeLocalWithTrefle(plant, { ...mapped, id: plant.id }),
        stateCode,
      );
      const existing = getPlantById(plant.id);
      if (existing?.image_url && !merged.image_url) {
        merged.image_url = existing.image_url;
      }
      upsertPlant(merged);
      enriched++;
      await sleep(550);
    } catch {
      /* skip */
    }
  }
  console.log(`  Trefle-enriched curated rows: ${enriched}`);
}

function listStatePlantsMissingImages(stateCode: DesignerStateCode) {
  const tag = stateCode.toLowerCase();
  const rows = getDb()
    .prepare(
      `SELECT * FROM plants
       WHERE tags LIKE @like
         AND (image_url IS NULL OR image_url = '')
       ORDER BY common_name
       LIMIT 8000`,
    )
    .all({ like: `%${tag}%` }) as Parameters<typeof rowToPlant>[0][];
  return rows.map((r) => rowToPlant(r));
}

function listStatePlantsForEnrich(stateCode: DesignerStateCode, limit: number) {
  const tag = stateCode.toLowerCase();
  const rows = getDb()
    .prepare(
      `SELECT * FROM plants
       WHERE tags LIKE @like
       ORDER BY
         CASE WHEN json_array_length(florida_hardiness_zones) = 0 THEN 0 ELSE 1 END,
         common_name
       LIMIT @limit`,
    )
    .all({ like: `%${tag}%`, limit }) as Parameters<typeof rowToPlant>[0][];
  return rows.map((r) => rowToPlant(r));
}

async function runEnrichPass(stateCode: DesignerStateCode) {
  const max = parseInt(process.env.IMPORT_ENRICH_MAX ?? "400", 10);
  const queue = listStatePlantsForEnrich(stateCode, max);
  console.log(`  Enriching up to ${queue.length} ${stateCode} plants…`);
  let done = 0;
  for (const plant of queue) {
    const next = await enrichStatePlantRow(plant, enrichDelay);
    upsertPlant(tagPlantForState(next, stateCode));
    done++;
    if (done % 20 === 0) console.log(`    … ${done}/${queue.length}`);
  }
}

async function runImagePass(stateCode: DesignerStateCode) {
  const queue = listStatePlantsMissingImages(stateCode);
  console.log(`  Fetching images for ${queue.length} ${stateCode} plants…`);
  let done = 0;
  for (const plant of queue) {
    const next = await fetchImageForPlant(plant, imageDelay);
    if (next.image_url) upsertPlant(next);
    done++;
    if (done % 15 === 0) console.log(`    … ${done}/${queue.length}`);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const states = statesToRun();
  const token = process.env.TREFLE_API_TOKEN?.trim();
  const before = countPlants();

  console.log("State catalog import");
  console.log(`States: ${states.join(", ")}`);
  console.log(
    `Steps: seeds=${runSeeds} trefle=${runTrefle} enrich=${runEnrich} images=${runImages}`,
  );
  console.log("");

  for (const stateCode of states) {
    console.log(`\n── ${summarizeStateImport(stateCode)} ──`);

    if (runSeeds) {
      await syncCuratedSeeds(stateCode);
      if (token && args.includes("--enrich-seeds")) {
        await enrichSeedsFromTrefle(stateCode);
      }
    }

    if (runTrefle) {
      if (!token) {
        console.error("  Trefle import skipped — set TREFLE_API_TOKEN in .env");
      } else {
        const result = await importTrefleCatalogForState(token, {
          stateCode,
          maxRequests,
          fetchDetails,
          edibleOnly,
          hasImageOnly: args.includes("--has-image"),
          onProgress: (m) => console.log(`  ${m}`),
        });
        console.log(
          `  Trefle: scanned ${result.scanned}, imported ${result.imported}, skipped (zone) ${result.skippedNoZone}, requests ${result.requestsUsed}${result.rateLimited ? " [rate limited]" : ""}`,
        );
        if (result.rateLimited) {
          console.log(
            "  Re-run the same command later to continue (increase --max-requests).",
          );
        }
      }
    }

    if (runEnrich) await runEnrichPass(stateCode);
    if (runImages) await runImagePass(stateCode);
  }

  const after = countPlants();
  console.log(`\n✅ Database plants: ${before} → ${after}`);
  console.log(
    "\nTip: regenerate comprehensive seed files after large imports:",
  );
  console.log("  npx tsx scripts/build-state-comprehensive-seeds.ts");
  console.log("  npx tsx scripts/sync-state-seed-plants.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
