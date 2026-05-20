/**
 * On Vercel/fresh builds, food-forest rows may have no thumbnails after db:sync-seed.
 * Fetch IFAS images only when most curated plants are still missing photos.
 */
import { spawnSync } from "node:child_process";
import { getDb } from "../db/client.js";

const MIN_WITH_IMAGES = 200;

function foodForestWithImages(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM plants
       WHERE tags LIKE '%food-forest%'
         AND image_url IS NOT NULL AND trim(image_url) != ''`,
    )
    .get() as { c: number };
  return row.c;
}

const withImages = foodForestWithImages();
if (withImages >= MIN_WITH_IMAGES) {
  console.log(
    `Skipping image fetch (${withImages} food-forest plants already have photos).`,
  );
  process.exit(0);
}

console.log(
  `Only ${withImages} food-forest plants have photos; fetching IFAS thumbnails…`,
);
const r = spawnSync("npm", ["run", "images:fetch"], {
  stdio: "inherit",
  shell: true,
});
process.exit(r.status ?? 1);
