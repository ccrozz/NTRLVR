/**
 * Harvest state plant catalogs from the open web (not Trefle-only):
 *   • iNaturalist — research-grade plant observations per state
 *   • GBIF — occurrence-backed species checklist (Plantae)
 *   • USDA PLANTS — genus × state distribution search
 *   • Per-plant enrich: Wikipedia, USDA profile, iNaturalist/Wikimedia photos
 *     (+ optional Trefle merge when TREFLE_API_TOKEN is set)
 *
 * Usage:
 *   npm run harvest:web:tn
 *   npm run harvest:web:ct
 *   npm run harvest:web:both -- --enrich --images
 *   npx tsx scripts/harvest-web-state-catalog.ts --state=TN --inat-max=500 --gbif-max=500
 *   npx tsx scripts/harvest-web-state-catalog.ts --state=CT --no-gbif --enrich --images
 */
import { loadEnv } from "../lib/load-env.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import { countPlants, getPlantById, upsertPlant } from "../db/plant-repository-sqlite.js";
import { tagPlantForState } from "../lib/state-plant-import.js";
import { harvestWebSpeciesForState } from "../lib/web-harvest/harvest-state-species.js";
import { importDiscoveredSpecies } from "../lib/web-harvest/import-discovered.js";

loadEnv();

const args = process.argv.slice(2);
const stateArg =
  args.find((a) => a.startsWith("--state="))?.split("=")[1]?.toUpperCase() ??
  "both";
const inatMax = parseInt(
  args.find((a) => a.startsWith("--inat-max="))?.split("=")[1] ??
    process.env.WEB_HARVEST_INAT_MAX ??
    "3500",
  10,
);
const gbifMax = parseInt(
  args.find((a) => a.startsWith("--gbif-max="))?.split("=")[1] ??
    process.env.WEB_HARVEST_GBIF_MAX ??
    "3000",
  10,
);
const importMax = parseInt(
  args.find((a) => a.startsWith("--import-max="))?.split("=")[1] ?? "0",
  10,
);
const runSeeds = !args.includes("--no-seeds");
const runInat = !args.includes("--no-inat");
const runGbif = !args.includes("--no-gbif");
const runUsda = !args.includes("--no-usda");
const runEnrich = args.includes("--enrich");
const runImages = args.includes("--images");
const edibleOnly = args.includes("--edible-only");
const skipImport = args.includes("--discover-only");

function statesToRun(): DesignerStateCode[] {
  if (stateArg === "BOTH") return ["TN", "CT"];
  if (stateArg === "TN" || stateArg === "CT") return [stateArg];
  console.error("Use --state=TN, --state=CT, or --state=both");
  process.exit(1);
}

async function syncSeeds(stateCode: DesignerStateCode) {
  const seeds = designerSeedsForState(stateCode);
  for (const plant of seeds) {
    const row = tagPlantForState(plant, stateCode);
    const existing = getPlantById(row.id);
    if (existing?.image_url?.trim() && !row.image_url?.trim()) {
      upsertPlant({ ...row, image_url: existing.image_url });
    } else {
      upsertPlant(row);
    }
  }
  console.log(`  Curated seeds: ${seeds.length}`);
}

async function main() {
  const states = statesToRun();
  const before = countPlants();

  console.log("Web harvest — iNaturalist + GBIF + USDA + Wikipedia/Wikimedia");
  console.log(
    `Sources: inat=${runInat} gbif=${runGbif} usda=${runUsda} enrich=${runEnrich} images=${runImages}`,
  );
  console.log(`Limits: inat≤${inatMax} gbif≤${gbifMax} edibleOnly=${edibleOnly}\n`);

  for (const stateCode of states) {
    console.log(`\n════════ ${stateCode} ════════`);

    if (runSeeds) await syncSeeds(stateCode);

    const { discovered, counts } = await harvestWebSpeciesForState(
      stateCode,
      {
        inaturalist: runInat,
        gbif: runGbif,
        usda: runUsda,
      },
      { inatMax, gbifMax },
      (m) => console.log(`  ${m}`),
    );

    console.log(
      `\n  Unique species discovered: ${discovered.length} (inat ${counts.inaturalist}, gbif ${counts.gbif}, usda ${counts.usda})`,
    );

    if (skipImport) continue;

    const maxRows = importMax > 0 ? importMax : discovered.length;
    console.log(`  Importing up to ${maxRows} rows…`);

    const result = await importDiscoveredSpecies(discovered, {
      stateCode,
      enrich: runEnrich,
      images: runImages || !runEnrich,
      edibleOnly,
      maxRows,
      onProgress: (m) => console.log(`  ${m}`),
    });

    console.log(
      `  Upserted: ${result.upserted} | enriched: ${result.enriched} | images: ${result.imagesAdded} | skipped (non-edible): ${result.skippedEdible}`,
    );
  }

  console.log(`\n✅ Database: ${before} → ${countPlants()} plants`);
  console.log("\nRe-tag zone overlaps: npm run db:tag-state-plants");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
