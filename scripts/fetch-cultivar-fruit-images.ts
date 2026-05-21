/**
 * Fruit thumbnails for VH021 tomato, pepper, and squash cultivars.
 *
 *   npm run images:fetch:vh021-fruit
 *   npx tsx scripts/fetch-cultivar-fruit-images.ts --dry-run
 *   npx tsx scripts/fetch-cultivar-fruit-images.ts --crop=tomato
 */
import { loadEnv } from "../lib/load-env.js";
import { fetchCultivarFruitImage } from "../lib/cultivar-fruit-images.js";
import { getPlantById, rowToPlant, upsertPlant } from "../db/plant-repository-sqlite.js";
import { getDb } from "../db/client.js";
import type { Plant } from "../schema.js";

loadEnv();

const DELAY_MS = Number(process.env.IMAGE_FETCH_DELAY_MS ?? 550);
const dryRun = process.argv.includes("--dry-run");
const cropArg = process.argv.find((a) => a.startsWith("--crop="));
const cropFilter = cropArg?.split("=")[1] as
  | "tomato"
  | "pepper"
  | "squash"
  | undefined;
const idArg = process.argv.find((a) => a.startsWith("--id="));
const idFilter = idArg?.split("=")[1];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function listCultivars(): Plant[] {
  const db = getDb();
  if (idFilter) {
    const row = db.prepare("SELECT * FROM plants WHERE id = ?").get(idFilter);
    return row
      ? [rowToPlant(row as Parameters<typeof rowToPlant>[0])]
      : [];
  }
  const cropSql =
    cropFilter === "tomato"
      ? "id LIKE 'tomato-%'"
      : cropFilter === "pepper"
        ? "id LIKE 'pepper-%'"
        : cropFilter === "squash"
          ? "(id LIKE 'squash-%' OR id = 'seminole-pumpkin')"
          : `id LIKE 'tomato-%'
          OR id LIKE 'pepper-%'
          OR id LIKE 'squash-%'
          OR id = 'seminole-pumpkin'`;
  const rows = db
    .prepare(
      `SELECT * FROM plants
       WHERE ${cropSql}
       ORDER BY
         CASE
           WHEN id LIKE 'tomato-%' THEN 1
           WHEN id LIKE 'pepper-%' THEN 2
           ELSE 3
         END,
         common_name`,
    )
    .all();
  return rows.map((r) => rowToPlant(r as Parameters<typeof rowToPlant>[0]));
}

async function main() {
  const targets = listCultivars();
  console.log(
    `VH021 fruit images — ${targets.length} cultivars | dryRun=${dryRun}\n`,
  );

  let updated = 0;
  let failed = 0;
  const bySource: Record<string, number> = {};

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i]!;
    const existing = getPlantById(row.id) ?? row;

    try {
      const result = await fetchCultivarFruitImage(
        existing.id,
        existing.common_name,
        existing.scientific_name,
      );
      if (!result) {
        failed++;
        console.log(`  ⚠️  no fruit photo: ${existing.common_name} (${existing.id})`);
      } else if (dryRun) {
        console.log(`  🔍 ${existing.common_name} ← ${result.source}`);
        updated++;
      } else {
        upsertPlant({ ...existing, image_url: result.image_url });
        bySource[result.source] = (bySource[result.source] ?? 0) + 1;
        updated++;
        if (updated % 8 === 0 || i < 4) {
          console.log(`  ✅ ${existing.common_name} ← ${result.source}`);
        }
      }
    } catch (e) {
      failed++;
      console.log(
        `  ❌ ${existing.id}: ${e instanceof Error ? e.message : e}`,
      );
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
    if ((i + 1) % 15 === 0) console.log(`  … ${i + 1}/${targets.length}`);
  }

  console.log(
    `\nDone. ${dryRun ? "Would update" : "Updated"}: ${updated}, no fruit image: ${failed}`,
  );
  if (!dryRun) console.log("By source:", bySource);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
