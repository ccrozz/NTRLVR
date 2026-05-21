/**
 * Mark US-grown plants and infer hardiness zones via Trefle, Wikipedia, and USDA.
 *
 * By default processes every plant that still lacks US scope or hardiness zones.
 *
 *   npm run db:backfill-us
 *
 * Optional env:
 *   BACKFILL_US_MAX=500     — cap plants processed this run (0 = no cap)
 *   BACKFILL_US_OFFSET=0  — start offset into the incomplete queue
 *   BACKFILL_US_FORCE=true — re-run even on plants already marked complete
 *   BACKFILL_US_DELAY_MS=300 — pause between plants (API courtesy)
 */
import { loadEnv } from "../lib/load-env.js";
import { enrichPlantFromWeb } from "../lib/enrich-plant.js";
import { closeDb, getDb } from "./client.js";
import { rowToPlant, upsertPlant } from "./plant-repository-sqlite.js";
import type { Plant } from "../schema.js";

loadEnv();

const PAGE = 50;
const MAX =
  parseInt(process.env.BACKFILL_US_MAX ?? "0", 10) || Number.POSITIVE_INFINITY;
const START_OFFSET = parseInt(process.env.BACKFILL_US_OFFSET ?? "0", 10);
const FORCE = process.env.BACKFILL_US_FORCE === "true";
const DELAY_MS = parseInt(process.env.BACKFILL_US_DELAY_MS ?? "300", 10);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isUsScopeComplete(plant: Plant): boolean {
  return plant.grows_in_us && plant.florida_hardiness_zones.length > 0;
}

function usScopeChanged(before: Plant, after: Plant): boolean {
  if (before.grows_in_us !== after.grows_in_us) return true;
  if (before.florida_hardiness_zones.join() !== after.florida_hardiness_zones.join()) {
    return true;
  }
  if (before.native_states.join() !== after.native_states.join()) return true;
  return false;
}

function countIncomplete(): number {
  if (FORCE) {
    return (getDb().prepare("SELECT COUNT(*) AS n FROM plants").get() as { n: number })
      .n;
  }
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM plants
         WHERE NOT (grows_in_us = 1 AND json_array_length(florida_hardiness_zones) > 0)`,
      )
      .get() as { n: number }
  ).n;
}

function fetchPage(limit: number, offset: number) {
  const sql = FORCE
    ? `SELECT * FROM plants ORDER BY common_name ASC LIMIT @limit OFFSET @offset`
    : `SELECT * FROM plants
       WHERE NOT (grows_in_us = 1 AND json_array_length(florida_hardiness_zones) > 0)
       ORDER BY common_name ASC
       LIMIT @limit OFFSET @offset`;

  return getDb()
    .prepare(sql)
    .all({ limit, offset }) as Parameters<typeof rowToPlant>[0][];
}

async function main(): Promise<void> {
  const incomplete = countIncomplete();
  const cap = Number.isFinite(MAX) ? MAX : incomplete - START_OFFSET;

  console.log(
    `US/zone backfill — ${incomplete.toLocaleString()} plant(s) in queue` +
      (FORCE ? " (force: all plants)" : "") +
      (Number.isFinite(MAX) ? `, max this run: ${MAX}` : ", no cap") +
      (START_OFFSET > 0 ? `, offset: ${START_OFFSET}` : ""),
  );

  if (incomplete === 0) {
    console.log("Nothing left to backfill.");
    closeDb();
    return;
  }

  let offset = START_OFFSET;
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let stoppedEarly = false;

  while (processed < cap) {
    const pageSize = Math.min(PAGE, cap - processed);
    const rows = fetchPage(pageSize, offset);
    if (!rows.length) break;

    for (const row of rows) {
      if (processed >= cap) break;

      const plant = rowToPlant(row);
      processed++;

      if (!FORCE && isUsScopeComplete(plant)) {
        skipped++;
        continue;
      }

      try {
        const result = await enrichPlantFromWeb(plant);
        const changed = usScopeChanged(plant, result.plant);

        if (changed || result.enriched) {
          upsertPlant(result.plant);
          updated++;
          console.log(
            `  [${processed}/${Math.min(cap, incomplete)}] ${result.plant.common_name} → US:${result.plant.grows_in_us} zones:${result.plant.florida_hardiness_zones.slice(0, 5).join(",") || "—"}`,
          );
        }

        if (result.sources.some((s) => /rate limit/i.test(s))) {
          console.warn(
            `\nTrefle rate limit — pause, then resume:\n  BACKFILL_US_OFFSET=${START_OFFSET + processed} npm run db:backfill-us`,
          );
          stoppedEarly = true;
          break;
        }
      } catch (err) {
        console.warn(`  skip ${plant.common_name}:`, err);
      }

      if (DELAY_MS > 0) await sleep(DELAY_MS);
    }

    if (stoppedEarly || processed >= cap || rows.length < pageSize) break;
    offset += rows.length;
  }

  const usCount = (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM plants WHERE grows_in_us = 1")
      .get() as { n: number }
  ).n;
  const zoneCount = (
    getDb()
      .prepare(
        "SELECT COUNT(*) AS n FROM plants WHERE json_array_length(florida_hardiness_zones) > 0",
      )
      .get() as { n: number }
  ).n;
  const remaining = countIncomplete();

  console.log(
    `\nDone. Processed ${processed}, updated ${updated}, skipped ${skipped}.` +
      `\nCatalog: ${usCount} US-flagged, ${zoneCount} with zones, ${remaining} still incomplete.`,
  );

  if (remaining > 0 && !stoppedEarly) {
    console.log(`Run again to continue:\n  npm run db:backfill-us`);
  }

  closeDb();
}

await main();
