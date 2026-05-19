import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../lib/load-env.js";
import { TrefleClient } from "../trefle/client.js";
import { TrefleAuthError, TrefleRateLimitError } from "../trefle/errors.js";
import { mapDetailToPlant, mapListToPlant } from "../trefle/map-plant.js";
import type { TrefleSyncState } from "../trefle/types.js";
import { closeDb, DB_PATH, getDb } from "./client.js";
import { countPlants, upsertPlant } from "./plant-repository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, "../data/trefle-sync-state.json");

loadEnv();

const TOKEN = process.env.TREFLE_API_TOKEN;
if (!TOKEN) {
  console.error("Missing TREFLE_API_TOKEN in .env");
  process.exit(1);
}

const MAX_REQUESTS = parseInt(
  process.env.TREFLE_MAX_REQUESTS_PER_RUN ?? "100",
  10,
);
const CLEAR_DB = process.env.TREFLE_CLEAR_DB === "true";
const FETCH_DETAILS = process.env.TREFLE_FETCH_DETAILS === "true";

function buildFilters(): Record<string, string> {
  const filters: Record<string, string> = {};
  if (process.env.TREFLE_FILTER_EDIBLE === "true") {
    filters["filter[edible]"] = "true";
  }
  if (process.env.TREFLE_FILTER_VEGETABLE === "true") {
    filters["filter[vegetable]"] = "true";
  }
  if (process.env.TREFLE_FILTER_HAS_IMAGE === "true") {
    filters["filter_not[image_url]"] = "null";
  }
  if (process.env.TREFLE_Q?.trim()) {
    filters["filter[common_name]"] = process.env.TREFLE_Q.trim();
  }
  return filters;
}

function loadState(baseFilters: Record<string, string>): TrefleSyncState {
  if (fs.existsSync(STATE_PATH)) {
    const saved = JSON.parse(
      fs.readFileSync(STATE_PATH, "utf-8"),
    ) as TrefleSyncState;
    if (JSON.stringify(saved.baseFilters) === JSON.stringify(baseFilters)) {
      return saved;
    }
    console.log("Sync filters changed — restarting from page 1.");
  }
  return {
    listPage: 1,
    lastPage: null,
    pendingSlugs: [],
    totalUpserted: 0,
    baseFilters,
  };
}

function saveState(state: TrefleSyncState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function sync(): Promise<void> {
  const baseFilters = buildFilters();
  const client = new TrefleClient(TOKEN!);
  const state = loadState(baseFilters);
  const catalogFilteredEdible = baseFilters["filter[edible]"] === "true";

  let requests = 0;
  let rateLimited = false;
  let cleared = false;

  console.log(`Trefle sync → ${DB_PATH}`);
  console.log(
    `Mode: ${FETCH_DETAILS ? "list + full plant detail" : "list import (detail on view/enrich)"}`,
  );
  console.log(`Max API requests this run: ${MAX_REQUESTS}`);
  if (Object.keys(baseFilters).length) {
    console.log(`Filters: ${JSON.stringify(baseFilters)}`);
  }
  console.log("");

  try {
    while (requests < MAX_REQUESTS) {
      if (
        state.lastPage !== null &&
        state.listPage > state.lastPage &&
        !state.pendingSlugs.length
      ) {
        console.log("\nSync complete — all catalog pages imported.");
        break;
      }

      if (
        FETCH_DETAILS &&
        state.pendingSlugs.length &&
        requests < MAX_REQUESTS
      ) {
        const slug = state.pendingSlugs.shift()!;
        try {
          const { data } = await client.fetchPlantBySlug(slug);
          requests++;
          upsertPlant(mapDetailToPlant(data, { storeJson: true }));
          state.totalUpserted++;
        } catch (err) {
          if (err instanceof TrefleRateLimitError) {
            state.pendingSlugs.unshift(slug);
            rateLimited = true;
            break;
          }
          console.warn(`  Skipped detail ${slug}:`, err);
        }
        saveState(state);
        continue;
      }

      if (state.lastPage !== null && state.listPage > state.lastPage) {
        break;
      }

      const list = await client.fetchPlantsPage(state.listPage, baseFilters);
      requests++;

      if (CLEAR_DB && !cleared) {
        getDb().exec("DELETE FROM plants");
        state.totalUpserted = 0;
        cleared = true;
        console.log("Cleared plants table.");
      }

      if (state.lastPage === null) {
        state.lastPage =
          TrefleClient.parseLastPage(list.links) ??
          Math.ceil(list.meta.total / list.data.length);
        console.log(
          `Catalog: ${list.meta.total.toLocaleString()} plants, ~${state.lastPage} pages`,
        );
      }

      for (const item of list.data) {
        upsertPlant(mapListToPlant(item, { catalogFilteredEdible }));
        state.totalUpserted++;
        if (FETCH_DETAILS) state.pendingSlugs.push(item.slug);
      }

      console.log(
        `Page ${state.listPage}/${state.lastPage} → saved ${list.data.length} plants`,
      );
      state.listPage++;
      saveState(state);
    }
  } catch (err) {
    if (err instanceof TrefleRateLimitError) rateLimited = true;
    else if (err instanceof TrefleAuthError) {
      console.error(`\n${err.message}`);
      closeDb();
      process.exit(1);
    } else throw err;
  }

  const pagesLeft =
    state.lastPage === null
      ? "?"
      : Math.max(0, state.lastPage - state.listPage + 1);

  console.log(`\nRun finished.`);
  console.log(`  Plants in DB: ${countPlants().toLocaleString()}`);
  console.log(`  List pages remaining: ${pagesLeft}`);
  console.log(`  Detail queue: ${state.pendingSlugs.length}`);
  console.log(`  API requests used: ${requests}/${MAX_REQUESTS}`);
  if (rateLimited) {
    console.log(`  Rate limited — wait, then run \`npm run db:seed\` again.`);
  } else if (pagesLeft !== 0 && pagesLeft !== "?") {
    console.log(`  Run \`npm run db:seed\` again to continue.`);
  }
  console.log(`  State: ${STATE_PATH}`);

  closeDb();
}

await sync();
