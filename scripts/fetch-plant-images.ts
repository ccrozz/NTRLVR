/**
 * Fill plant image_url — iNaturalist-first (research-grade), Wikimedia/Wikipedia fallback.
 *
 * Usage:
 *   npm run images:fetch              # IFAS food-forest, missing only
 *   npm run images:fetch:inat         # replace non-iNat thumbnails in IFAS catalog
 *   npm run images:fetch:all          # all plants, missing only
 *   npx tsx scripts/fetch-plant-images.ts --force
 */
import { loadEnv } from "../lib/load-env.js";
import {
  fetchBestPlantImage,
  fetchInaturalistOnlyPlantImage,
  isInaturalistImageUrl,
  type ImageSource,
} from "../lib/plant-images.js";
import {
  countPlants,
  getPlantById,
  rowToPlant,
  upsertPlant,
} from "../db/plant-repository.js";
import { getDb } from "../db/client.js";
import type { Plant } from "../schema.js";

loadEnv();

const DELAY_MS = Number(process.env.IMAGE_FETCH_DELAY_MS ?? 500);
const force = process.argv.includes("--force");
const inatOnly = process.argv.includes("--inat-only");
const replaceNonInat = process.argv.includes("--replace-non-inat");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const sourceFilter = sourceArg?.split("=")[1];
const tagsArg = process.argv.find((a) => a.startsWith("--tags="));
const tagsFilter = tagsArg?.split("=")[1]?.toLowerCase();
const stateArg = process.argv.find((a) => a.startsWith("--state="));
const stateTag =
  tagsFilter ??
  (stateArg ? stateArg.split("=")[1]?.toLowerCase() : undefined);

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

  if (stateTag) {
    conditions.push("tags LIKE @tagLike");
    params.tagLike = `%${stateTag}%`;
  }

  if (force) {
    /* all rows matching source filter */
  } else if (replaceNonInat) {
    conditions.push(
      "(image_url IS NULL OR image_url = '' OR (image_url NOT LIKE '%inaturalist.org%' AND image_url NOT LIKE '%inaturalist-open-data.s3.amazonaws.com%'))",
    );
  } else {
    conditions.push("(image_url IS NULL OR image_url = '')");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM plants ${where} ORDER BY common_name LIMIT 5000`)
    .all(params);

  return rows.map((r) => rowToPlant(r as Parameters<typeof rowToPlant>[0]));
}

async function main() {
  console.log(
    `Image fetch — iNaturalist-first | force=${force} inatOnly=${inatOnly} replaceNonInat=${replaceNonInat} source=${sourceFilter ?? "all"} tag=${stateTag ?? "all"}`,
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
  let alreadyInat = 0;

  const fetchImage = inatOnly
    ? fetchInaturalistOnlyPlantImage
    : fetchBestPlantImage;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i]!;
    const existing = getPlantById(row.id) ?? row;

    if (
      !force &&
      !replaceNonInat &&
      existing.image_url &&
      isInaturalistImageUrl(existing.image_url)
    ) {
      skipped++;
      continue;
    }

    if (
      !force &&
      !replaceNonInat &&
      existing.image_url &&
      !isInaturalistImageUrl(existing.image_url)
    ) {
      skipped++;
      continue;
    }

    if (
      replaceNonInat &&
      !force &&
      existing.image_url &&
      isInaturalistImageUrl(existing.image_url)
    ) {
      alreadyInat++;
      continue;
    }

    try {
      const result = await fetchImage(
        existing.common_name,
        existing.scientific_name,
      );
      if (!result) {
        failed++;
        if (failed <= 20 || i < 5) {
          console.log(`  ⚠️  no image: ${existing.common_name} (${existing.id})`);
        }
      } else if (replaceNonInat && !isInaturalistImageUrl(result.image_url)) {
        failed++;
        console.log(
          `  ⚠️  iNat only — skipped ${existing.common_name} (got ${result.source})`,
        );
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

  const foodForestInat = getDb()
    .prepare(
      `SELECT COUNT(*) AS c FROM plants
       WHERE tags LIKE '%food-forest%'
         AND image_url LIKE '%inaturalist%'`,
    )
    .get() as { c: number };

  console.log(
    `\nDone. Updated: ${updated}, skipped: ${skipped}, already iNat: ${alreadyInat}, no image: ${failed}`,
  );
  console.log("By source:", bySource);
  console.log(
    `DB total: ${countPlants()} with images: ${withImages.c} | food-forest iNat URLs: ${foodForestInat.c}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
