/**
 * Bulk-enrich seed plants from Trefle by scientific name.
 * Usage: TREFLE_API_KEY=xxx npx tsx scripts/enrich-from-trefle.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEED_PLANTS } from "../data/plants.seed.js";
import {
  mapTrefleDetailToPlant,
  searchTrefleByScientificName,
} from "../lib/trefle-api.js";
import type { Plant } from "../schema.js";

const OUT = resolve(process.cwd(), "data/trefle-enrichment.json");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const out: Record<string, Partial<Plant>> = {};

  for (const seed of SEED_PLANTS) {
    await sleep(600);
    try {
      const detail = await searchTrefleByScientificName(seed.scientific_name);
      if (!detail) {
        console.log(`⚠️  not found: ${seed.id} (${seed.scientific_name})`);
        continue;
      }
      const mapped = mapTrefleDetailToPlant(detail);
      out[seed.id] = {
        trefle_id: mapped.trefle_id,
        trefle_slug: mapped.trefle_slug,
        image_url: mapped.image_url,
        mature_height_feet: mapped.mature_height_feet,
        mature_spread_feet: mapped.mature_spread_feet,
        canvas_radius_feet: mapped.canvas_radius_feet,
        sunlight: mapped.sunlight,
        water_needs: mapped.water_needs,
        growth_rate: mapped.growth_rate,
        florida_hardiness_zones: mapped.florida_hardiness_zones,
        care_summary: mapped.care_summary || seed.care_summary,
        data_source: "trefle",
      };
      console.log(`✅ ${seed.id} → trefle_id ${mapped.trefle_id}`);
    } catch (e) {
      console.log(
        `❌ ${seed.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${Object.keys(out).length} entries to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
