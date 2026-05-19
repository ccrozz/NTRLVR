/**
 * Fill missing plant image_url from Unsplash / iNaturalist / Wikimedia / Wikipedia.
 *
 * Usage:
 *   npx tsx scripts/fetch-plant-images.ts
 *   npx tsx scripts/fetch-plant-images.ts --source=ifas
 *   npx tsx scripts/fetch-plant-images.ts --force
 *   UNSPLASH_ACCESS_KEY=xxx npx tsx scripts/fetch-plant-images.ts
 */
import { loadEnv } from "../lib/load-env.js";
import { fetchBestPlantImage, type ImageSource } from "../lib/plant-images.js";
import {
  countPlants,
  getPlantById,
  rowToPlant,
  upsertPlant,
} from "../db/plant-repository.js";
import { getDb } from "../db/client.js";
import type { Plant } from "../schema.js";

loadEnv();

const DELAY_MS = Number(process.env.IMAGE_FETCH_DELAY_MS ?? 450);
const force = process.argv.includes("--force");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const sourceFilter = sourceArg?.split("=")[1];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function listTargets(): Plant[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (sourceFilter) {
    conditions.push("data_source = @source");
    params.source = sourceFilter;
  }
  if (!force) {
    conditions.push("(image_url IS NULL OR image_url = '')");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM plants ${where} ORDER BY common_name LIMIT 5000`)
    .all(params);

  return rows.map((r) => rowToPlant(r as Parameters<typeof rowToPlant>[0]));
}

async function main() {
  const hasUnsplash = Boolean(
    process.env.UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_CLIENT_ID,
  );
  console.log(
    `Image fetch — force=${force} source=${sourceFilter ?? "all"} unsplash=${hasUnsplash}`,
  );

  const targets = listTargets();
  console.log(`Plants to process: ${targets.length}\n`);

  const bySource: Record<ImageSource, number> = {
    unsplash: 0,
    inaturalist: 0,
    wikimedia: 0,
    wikipedia: 0,
  };
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i]!;
    const existing = getPlantById(row.id) ?? row;

    if (!force && existing.image_url) {
      skipped++;
      continue;
    }

    try {
      const result = await fetchBestPlantImage(
        existing.common_name,
        existing.scientific_name,
      );
      if (!result) {
        failed++;
        console.log(`  ⚠️  no image: ${existing.id}`);
      } else {
        upsertPlant({ ...existing, image_url: result.image_url });
        bySource[result.source]++;
        updated++;
        if (updated % 10 === 0 || i < 5) {
          console.log(
            `  ✅ ${existing.common_name} ← ${result.source}`,
          );
        }
      }
    } catch (e) {
      failed++;
      console.log(
        `  ❌ ${existing.id}: ${e instanceof Error ? e.message : e}`,
      );
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
    if ((i + 1) % 25 === 0) {
      console.log(`  … ${i + 1}/${targets.length}`);
    }
  }

  const withImages = getDb()
    .prepare(
      `SELECT COUNT(*) AS c FROM plants WHERE image_url IS NOT NULL AND image_url != ''`,
    )
    .get() as { c: number };

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, no image: ${failed}`);
  console.log("By source:", bySource);
  console.log(`DB total plants: ${countPlants()}, with images: ${withImages.c}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
