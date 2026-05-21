/**
 * Reclassify non-edible Arecaceae stubs (e.g. Bactris) mis-tagged as Palm.
 *
 *   npx tsx scripts/fix-nonfood-palm-categories.ts
 */
import { getDb } from "../db/client.js";

const db = getDb();
const rows = db
  .prepare(
    `SELECT id, scientific_name, canopy_layer FROM plants
     WHERE category = 'Palm' AND is_edible = 0`,
  )
  .all() as { id: string; scientific_name: string; canopy_layer: string }[];

const upd = db.prepare(
  `UPDATE plants SET category = 'Native Shrub' WHERE id = ?`,
);

let n = 0;
for (const row of rows) {
  upd.run(row.id);
  n++;
}

console.log(`Reclassified ${n} non-edible Palm rows → Native Shrub`);
