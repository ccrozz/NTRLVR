/**
 * Scrape every US state catalog and report same-title / same-species duplicates.
 * Usage: npx tsx scripts/scan-all-state-catalogs.ts
 */
import { loadEnv } from "../lib/load-env.js";

loadEnv();

import { US_STATES } from "../lib/us-states.js";
import { listPlants } from "../db/plant-repository.js";
import {
  compactCatalogName,
  dedupeAreaCatalogPlants,
} from "../lib/plant-dedupe.js";

type Card = {
  id: string;
  common_name: string;
  scientific_name?: string | null;
};

function groupBy<T extends Card>(
  items: T[],
  keyFn: (p: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const p of items) {
    const key = keyFn(p);
    const g = map.get(key);
    if (g) g.push(p);
    else map.set(key, [p]);
  }
  return map;
}

function dupeGroups<T extends Card>(
  items: T[],
  keyFn: (p: T) => string,
): [string, T[]][] {
  return [...groupBy(items, keyFn).entries()]
    .filter(([, g]) => g.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
}

async function scrapeState(code: string, name: string) {
  const { data } = await listPlants({
    native_state: code,
    for_my_area: true,
    limit: 20_000,
    offset: 0,
  });
  const raw: Card[] = data.map((p) => ({
    id: p.id,
    common_name: p.common_name,
    scientific_name: p.scientific_name,
  }));
  const deduped = dedupeAreaCatalogPlants(raw, code);

  const titleKey = (p: Card) => compactCatalogName(p.common_name);

  const rawTitle = dupeGroups(raw, titleKey);
  const afterTitle = dupeGroups(deduped, titleKey);
  const leaked = deduped.filter((p) => {
    if (code !== "TN" && p.id.startsWith("tn-")) return true;
    if (code !== "CT" && p.id.startsWith("ct-")) return true;
    return false;
  });

  return {
    code,
    name,
    raw: raw.length,
    deduped: deduped.length,
    rawTitleGroups: rawTitle.length,
    rawTitleExtra: rawTitle.reduce((n, [, g]) => n + g.length - 1, 0),
    afterTitleGroups: afterTitle.length,
    afterTitleExtra: afterTitle.reduce((n, [, g]) => n + g.length - 1, 0),
    leaked: leaked.length,
    topAfterTitle: afterTitle.slice(0, 6).map(([k, g]) => ({
      key: k,
      count: g.length,
      ids: g.slice(0, 5).map((p) => p.id),
    })),
    topRawTitle: rawTitle.slice(0, 4).map(([k, g]) => ({
      key: k,
      count: g.length,
    })),
  };
}

async function main() {
  const rows = [];
  for (const st of US_STATES) {
    const row = await scrapeState(st.code, st.name);
    const flag = row.afterTitleGroups || row.leaked ? "DUPES" : "ok";
    console.log(
      `${flag} ${st.code} raw=${row.raw} after=${row.deduped} title-dupes=${row.afterTitleGroups}(${row.afterTitleExtra} extra) leaked=${row.leaked}`,
    );
    if (row.topAfterTitle.length) {
      for (const g of row.topAfterTitle) {
        console.log(`     "${g.key}" x${g.count}: ${g.ids.join(", ")}`);
      }
    }
    rows.push(row);
  }

  const dirty = rows.filter((r) => r.afterTitleGroups || r.leaked);
  const rawExtra = rows.reduce((n, r) => n + r.rawTitleExtra, 0);
  const afterExtra = rows.reduce((n, r) => n + r.afterTitleExtra, 0);
  console.log(
    `\n${rows.length} states. Raw same-title extras=${rawExtra}. After current dedupe extras=${afterExtra}. States still dirty=${dirty.length}`,
  );
  if (dirty.length) {
    console.log(
      "Dirty:",
      dirty.map((r) => `${r.code}:${r.afterTitleGroups}`).join(", "),
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
