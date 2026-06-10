/**
 * Replace homonym thumbnails (e.g. Viola genus → viola/violin instrument photos).
 *
 *   npx tsx scripts/fix-bad-plant-images.ts
 *   npx tsx scripts/fix-bad-plant-images.ts --dry-run
 */
import { loadEnv } from "../lib/load-env.js";
import { listPlants, upsertPlant } from "../db/plant-repository.js";
import { fetchBestPlantImage } from "../lib/plant-images.js";
import { isRejectedPlantImageUrl } from "../lib/plant-image-quality.js";

loadEnv();

const dryRun = process.argv.includes("--dry-run");
const DELAY_MS = Number(process.env.IMAGE_FETCH_DELAY_MS ?? 400);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { data } = await listPlants({ limit: 20_000, offset: 0 });
  const bad = data.filter((p) => isRejectedPlantImageUrl(p.image_url));
  console.log(
    `Bad plant images: ${bad.length}${dryRun ? " (dry run)" : ""}`,
  );

  let fixed = 0;
  let cleared = 0;

  for (const plant of bad) {
    console.log(`  ${plant.common_name} (${plant.scientific_name})`);
    if (dryRun) continue;

    const img = await fetchBestPlantImage(
      plant.common_name,
      plant.scientific_name,
    );
    if (img) {
      await upsertPlant({ ...plant, image_url: img.image_url });
      fixed++;
      console.log(`    → ${img.source}: ${img.image_url.slice(0, 72)}…`);
    } else {
      await upsertPlant({ ...plant, image_url: null });
      cleared++;
      console.log("    → cleared (no replacement found)");
    }
    await sleep(DELAY_MS);
  }

  if (!dryRun) {
    console.log(`\nDone. Replaced ${fixed}, cleared ${cleared}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
