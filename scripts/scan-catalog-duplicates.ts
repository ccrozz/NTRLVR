/**
 * Scan plant DB + public catalog APIs for same-name / same-species duplicates.
 * Usage: npx tsx scripts/scan-catalog-duplicates.ts
 */
import { loadEnv } from "../lib/load-env.js";
import { getSql } from "../db/postgres.js";

loadEnv();
import {
  catalogDedupKeys,
  normalizePlantName,
  speciesDedupKey,
} from "../lib/plant-dedupe.js";

const sql = getSql();

type Row = {
  id: string;
  common_name: string;
  scientific_name: string;
  data_source: string;
  tags: unknown;
  image_url: string | null;
};

function tagList(tags: unknown): string {
  if (Array.isArray(tags)) return tags.join(",");
  return String(tags ?? "");
}

async function main() {
  const rows = (await sql`
    SELECT id, common_name, scientific_name, data_source, tags, image_url
    FROM plants
    ORDER BY common_name
  `) as Row[];

  console.log(`DB plants: ${rows.length}`);

  const beauty = rows.filter(
    (r) =>
      /beautyberry/i.test(r.common_name) ||
      /callicarpa americana/i.test(r.scientific_name),
  );
  console.log("\n=== Beautyberry / Callicarpa americana rows ===");
  for (const r of beauty) {
    console.log(
      `  ${r.id} | ${r.common_name} | ${r.scientific_name} | ${r.data_source} | tags=${tagList(r.tags)}`,
    );
  }

  const byDisplay = new Map<string, Row[]>();
  const bySpecies = new Map<string, Row[]>();
  for (const r of rows) {
    const d = normalizePlantName(r.common_name);
    const s = speciesDedupKey(r.common_name, r.scientific_name);
    (byDisplay.get(d) ?? (byDisplay.set(d, []), byDisplay.get(d)!)).push(r);
    (bySpecies.get(s) ?? (bySpecies.set(s, []), bySpecies.get(s)!)).push(r);
  }

  const displayDupes = [...byDisplay.entries()].filter(([, g]) => g.length > 1);
  const speciesDupes = [...bySpecies.entries()].filter(([, g]) => g.length > 1);

  console.log(`\n=== Same display name (${displayDupes.length} groups) ===`);
  displayDupes
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 40)
    .forEach(([k, g]) => {
      console.log(`  "${k}" x${g.length}: ${g.map((r) => r.id).join(", ")}`);
    });

  console.log(`\n=== Same species key (${speciesDupes.length} groups) ===`);
  speciesDupes
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 40)
    .forEach(([k, g]) => {
      console.log(`  "${k}" x${g.length}: ${g.map((r) => r.id).join(", ")}`);
    });

  for (const state of ["FL", "TN", "CT"]) {
    const items: { id: string; common_name: string; scientific_name: string }[] =
      [];
    let offset = 0;
    for (;;) {
      const url = `http://localhost:3001/api/plants?state=${state}&for_my_area=true&limit=100&offset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`\nAPI ${state} failed ${res.status}`);
        break;
      }
      const json = (await res.json()) as {
        data: typeof items;
        meta: { total: number };
      };
      items.push(...json.data);
      offset += json.data.length;
      if (!json.data.length || offset >= json.meta.total || offset > 5000) break;
    }
    const seen = new Map<string, string[]>();
    for (const p of items) {
      for (const key of catalogDedupKeys(p.common_name, p.scientific_name)) {
        const g = seen.get(key) ?? [];
        if (!g.includes(p.id)) g.push(p.id);
        seen.set(key, g);
      }
    }
    const apiDupes = [...seen.entries()].filter(([, ids]) => ids.length > 1);
    console.log(
      `\n=== ${state} catalog API: ${items.length} cards, ${apiDupes.length} duplicate key groups ===`,
    );
    apiDupes.slice(0, 25).forEach(([k, ids]) => {
      console.log(`  ${k} → ${ids.join(", ")}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
