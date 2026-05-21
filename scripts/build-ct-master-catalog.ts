/**
 * Build ct-food-forest-master.ts from data/ct-catalog.tsv (user CT plant list).
 * Skips plants already in ct-food-forest-plants.ts or ct-food-forest-comprehensive.ts.
 *
 *   npx tsx scripts/build-ct-master-catalog.ts
 *   npm run db:sync-state-seeds
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CompactSeed, PlantCategory, CanopyLayer } from "../data/seed-helpers.js";
import { CT_FOOD_FOREST_COMPREHENSIVE } from "../data/ct-food-forest-comprehensive.js";
import { CT_FOOD_FOREST_PLANTS } from "../data/ct-food-forest-plants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TSV = path.join(ROOT, "data/ct-catalog.tsv");
const OUT = path.join(ROOT, "data/ct-food-forest-master.ts");

const Z = ["5b", "6a", "6b", "7a"] as const;

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
}

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normSci(sci: string): string {
  return sci.toLowerCase().replace(/\s+/g, " ").trim();
}

const existing = new Set<string>();
const existingSci = new Set<string>();
for (const p of [...CT_FOOD_FOREST_PLANTS, ...CT_FOOD_FOREST_COMPREHENSIVE]) {
  existing.add(normName(p.common_name));
  existingSci.add(normSci(p.scientific_name));
  existing.add(`${normSci(p.scientific_name)}|${normName(p.common_name)}`);
}

function parseLine(line: string): CompactSeed | null {
  const t = line.split("\t");
  if (t.length < 4 || t[0].startsWith("#")) return null;
  const [name, sci, cat, layer, flags = "", note = ""] = t.map((x) => x.trim());
  if (!name || !sci) return null;

  const f = flags.split(/\s+/).filter(Boolean);
  const nat = f.includes("nat");
  const k = f.includes("k");
  const inv = f.includes("inv");
  const eat = f.includes("eat") ? true : undefined;
  const guild = f.includes("N") ? (["Nitrogen Fixer"] as const) : undefined;
  const dyn = f.includes("D") ? (["Dynamic Accumulator"] as const) : undefined;
  const pest = f.includes("P") ? (["Pest Repellent"] as const) : undefined;
  const tags = f
    .filter((x) => !["nat", "k", "inv", "eat", "N", "D", "P"].includes(x))
    .join(",")
    .split(",")
    .filter(Boolean);

  const key = normName(name);
  const sciKey = normSci(sci);
  if (existing.has(key) || existing.has(`${sciKey}|${key}`)) return null;

  const id = `ct-${slug(name)}`;
  if (existing.has(id)) return null;

  const zones =
    f.includes("z6") ? (["6a", "6b", "7a"] as string[]) : [...Z];

  const row: CompactSeed = {
    id,
    name,
    sci,
    cat: cat as PlantCategory,
    layer: layer as CanopyLayer,
    zones,
    nat: nat || undefined,
    k: k || undefined,
    inv: inv || undefined,
    eat,
    note: note || undefined,
    tags: tags.length ? tags : undefined,
    guild: guild
      ? [...(guild ?? []), ...(dyn ?? []), ...(pest ?? [])]
      : dyn
        ? [...dyn, ...(pest ?? [])]
        : pest,
  };

  existing.add(key);
  existing.add(`${sciKey}|${key}`);
  return row;
}

function compactLine(d: CompactSeed): string {
  const parts = [
    `id: "${d.id}"`,
    `name: ${JSON.stringify(d.name)}`,
    `sci: ${JSON.stringify(d.sci)}`,
    `cat: ${JSON.stringify(d.cat)}`,
    `layer: ${JSON.stringify(d.layer)}`,
    `zones: ${JSON.stringify(d.zones ?? Z)}`,
  ];
  if (d.k) parts.push("k: true");
  if (d.eat === false) parts.push("eat: false");
  if (d.nat) parts.push("nat: true");
  if (d.inv) parts.push("inv: true");
  if (d.guild?.length) parts.push(`guild: ${JSON.stringify(d.guild)}`);
  if (d.tags?.length) parts.push(`tags: ${JSON.stringify(d.tags)}`);
  if (d.note) parts.push(`note: ${JSON.stringify(d.note)}`);
  if (d.sun) parts.push(`sun: ${JSON.stringify(d.sun)}`);
  return `  { ${parts.join(", ")} },`;
}

function main() {
  const raw = fs.readFileSync(TSV, "utf-8");
  const rows: CompactSeed[] = [];
  for (const line of raw.split("\n")) {
    const row = parseLine(line);
    if (row) rows.push(row);
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const body = `/**
 * Connecticut master catalog — UConn / native / food-forest list (zones 5b–7a).
 * Generated from data/ct-catalog.tsv — do not edit by hand.
 *   npx tsx scripts/build-ct-master-catalog.ts
 */
import type { Plant } from "../schema.js";
import { compactStateSeeds } from "./seed-helpers.js";

const ROWS = compactStateSeeds(
[
${rows.map(compactLine).join("\n")}
],
  "CT",
);

export const CT_FOOD_FOREST_MASTER: Plant[] = ROWS;
`;

  fs.writeFileSync(OUT, body);
  console.log(`Wrote ${rows.length} new CT plants → ${path.basename(OUT)}`);
  console.log(`Skipped duplicates already in plants/comprehensive catalogs.`);
}

main();
