/**
 * Verify each state catalog has one card per plant (Beautyberry, same-title twins).
 * Usage: npx tsx scripts/verify-catalog-dedupe.ts
 */
import { loadEnv } from "../lib/load-env.js";

loadEnv();

import { listCatalogPlants } from "../lib/plant-list-service.js";
import {
  compactCatalogName,
  dedupeAreaCatalogPlants,
} from "../lib/plant-dedupe.js";

function assertBeautyberryCollapse() {
  const out = dedupeAreaCatalogPlants(
    [
      {
        id: "trefle-callicarpa-americana",
        common_name: "American beauty-berry",
        scientific_name: "Callicarpa americana",
      },
      {
        id: "ct-beautyberry",
        common_name: "American Beautyberry",
        scientific_name: "Callicarpa americana",
      },
      {
        id: "beautyberry",
        common_name: "American Beautyberry",
        scientific_name: "Callicarpa americana",
      },
      {
        id: "tn-beautyberry",
        common_name: "American Beautyberry",
        scientific_name: "Callicarpa americana",
      },
    ],
    "FL",
  );
  if (out.length !== 1 || out[0]?.id !== "beautyberry") {
    throw new Error(
      `FL beautyberry collapse failed: ${JSON.stringify(out.map((p) => p.id))}`,
    );
  }
  const tn = dedupeAreaCatalogPlants(
    [
      {
        id: "beautyberry",
        common_name: "American Beautyberry",
        scientific_name: "Callicarpa americana",
      },
      {
        id: "tn-beautyberry",
        common_name: "American Beautyberry",
        scientific_name: "Callicarpa americana",
      },
    ],
    "TN",
  );
  if (tn.length !== 1 || tn[0]?.id !== "tn-beautyberry") {
    throw new Error(
      `TN beautyberry collapse failed: ${JSON.stringify(tn.map((p) => p.id))}`,
    );
  }
  const carex = dedupeAreaCatalogPlants(
    [
      { id: "trefle-carex-loliacea", common_name: "carex", scientific_name: "Carex loliacea" },
      { id: "trefle-carex-bicolor", common_name: "carex", scientific_name: "Carex bicolor" },
      { id: "trefle-carex-rotundata", common_name: "Carex", scientific_name: "Carex rotundata" },
    ],
    "TX",
  );
  if (carex.length !== 1) {
    throw new Error(`genus-title collapse failed: ${carex.map((p) => p.id).join(",")}`);
  }
  console.log("unit: beautyberry + genus-title collapse OK");
}

async function scrapeState(state: string) {
  const items: {
    id: string;
    common_name: string;
    scientific_name?: string | null;
  }[] = [];
  let offset = 0;
  let total = 0;
  for (;;) {
    const { data, total: t } = await listCatalogPlants({
      native_state: state,
      for_my_area: true,
      limit: 200,
      offset,
    });
    total = t;
    items.push(...data);
    offset += data.length;
    if (!data.length || offset >= t) break;
  }

  const beauty = items.filter(
    (p) =>
      /beautyberry|beauty-berry/i.test(p.common_name) &&
      /callicarpa americana/i.test(p.scientific_name ?? ""),
  );
  const groups = new Map<string, string[]>();
  for (const p of items) {
    const key = compactCatalogName(p.common_name);
    const g = groups.get(key) ?? [];
    g.push(p.id);
    groups.set(key, g);
  }
  const dupes = [...groups.entries()].filter(([, ids]) => ids.length > 1);
  const leaked = items.filter((p) => {
    if (state !== "TN" && p.id.startsWith("tn-")) return true;
    if (state !== "CT" && p.id.startsWith("ct-")) return true;
    return false;
  });

  console.log(
    `\n${state}: ${items.length}/${total} cards, beautyberry=${beauty.map((p) => p.id).join(",") || "none"}, same-title dupes=${dupes.length}, leaked=${leaked.length}`,
  );
  if (beauty.length !== 1) {
    throw new Error(`${state} expected 1 American Beautyberry, got ${beauty.length}`);
  }
  if (dupes.length) {
    console.log(
      "  remaining dupes:",
      dupes.slice(0, 8).map(([k, ids]) => `${k}→${ids.join(",")}`),
    );
    throw new Error(`${state} still has ${dupes.length} duplicate groups`);
  }
  if (leaked.length) {
    throw new Error(
      `${state} leaked other-state ids: ${leaked
        .slice(0, 8)
        .map((p) => p.id)
        .join(", ")}`,
    );
  }
}

async function main() {
  assertBeautyberryCollapse();
  for (const state of ["FL", "TN", "CT"]) {
    await scrapeState(state);
  }
}

main()
  .then(() => {
    console.log("\nall state catalogs de-duplicated");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
