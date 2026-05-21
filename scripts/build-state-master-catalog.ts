/**
 * Build *-food-forest-master.ts from data/{state}-catalog.tsv.
 * Skips rows already in that state's plants + comprehensive modules.
 *
 *   npx tsx scripts/build-state-master-catalog.ts --state=TN
 *   npx tsx scripts/build-state-master-catalog.ts --state=CT
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CompactSeed, PlantCategory, CanopyLayer } from "../data/seed-helpers.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { CT_FOOD_FOREST_COMPREHENSIVE } from "../data/ct-food-forest-comprehensive.js";
import { CT_FOOD_FOREST_PLANTS } from "../data/ct-food-forest-plants.js";
import { CT_FOOD_FOREST_MASTER } from "../data/ct-food-forest-master.js";
import { TN_FOOD_FOREST_COMPREHENSIVE } from "../data/tn-food-forest-comprehensive.js";
import { TN_FOOD_FOREST_PLANTS } from "../data/tn-food-forest-plants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const STATE_CONFIG: Record<
  DesignerStateCode,
  {
    zones: string[];
    z6?: string[];
    z7?: string[];
    z8?: string[];
    existing: { id: string; common_name: string; scientific_name: string }[];
    exportName: string;
    fileName: string;
    title: string;
  }
> = {
  FL: { zones: [], z6: [], existing: [], exportName: "", fileName: "", title: "" },
  TN: {
    zones: ["6a", "6b", "7a", "7b", "8a"],
    z6: ["6a", "6b", "7a"],
    z7: ["7a", "7b", "8a"],
    z8: ["8a"],
    existing: [
      ...TN_FOOD_FOREST_PLANTS,
      ...TN_FOOD_FOREST_COMPREHENSIVE,
    ],
    exportName: "TN_FOOD_FOREST_MASTER",
    fileName: "tn-food-forest-master.ts",
    title: "Tennessee master catalog — zones 6a–8a",
  },
  CT: {
    zones: ["5b", "6a", "6b", "7a"],
    z6: ["6a", "6b", "7a"],
    existing: [
      ...CT_FOOD_FOREST_PLANTS,
      ...CT_FOOD_FOREST_COMPREHENSIVE,
      ...CT_FOOD_FOREST_MASTER,
    ],
    exportName: "CT_FOOD_FOREST_MASTER",
    fileName: "ct-food-forest-master.ts",
    title: "Connecticut master catalog — zones 5b–7a",
  },
};

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

function resolveState(): DesignerStateCode {
  const arg = process.argv.find((a) => a.startsWith("--state="))?.split("=")[1];
  const code = (arg ?? "TN").toUpperCase() as DesignerStateCode;
  if (code !== "TN" && code !== "CT") {
    console.error("Use --state=TN or --state=CT");
    process.exit(1);
  }
  return code;
}

function main() {
  const stateCode = resolveState();
  const cfg = STATE_CONFIG[stateCode];
  const prefix = stateCode.toLowerCase();
  const tsv = path.join(ROOT, "data", `${prefix}-catalog.tsv`);
  const out = path.join(ROOT, "data", cfg.fileName);

  const existing = new Set<string>();
  for (const p of cfg.existing) {
    existing.add(normName(p.common_name));
    existing.add(`${normSci(p.scientific_name)}|${normName(p.common_name)}`);
    existing.add(p.id);
  }

  function parseLine(line: string): CompactSeed | null {
    const t = line.split("\t");
    if (t.length < 4 || t[0].startsWith("#")) return null;
    const [name, sci, cat, layer, flags = "", note = ""] = t.map((x) => x.trim());
    if (!name || !sci) return null;

    const f = flags.split(/\s+/).filter(Boolean);
    const key = normName(name);
    const sciKey = normSci(sci);
    if (existing.has(key) || existing.has(`${sciKey}|${key}`)) return null;

    const id = `${prefix}-${slug(name)}`;
    if (existing.has(id)) return null;

    let zones = [...cfg.zones];
    if (f.includes("z8") && cfg.z8) zones = cfg.z8;
    else if (f.includes("z7") && cfg.z7) zones = cfg.z7;
    else if (f.includes("z6") && cfg.z6) zones = cfg.z6;

    const guildParts: string[] = [];
    if (f.includes("N")) guildParts.push("Nitrogen Fixer");
    if (f.includes("D")) guildParts.push("Dynamic Accumulator");
    if (f.includes("P")) guildParts.push("Pest Repellent");

    const tags = f
      .filter((x) => !["nat", "k", "inv", "eat", "N", "D", "P", "z6", "z7", "z8"].includes(x))
      .join(",")
      .split(",")
      .filter(Boolean);

    const row: CompactSeed = {
      id,
      name,
      sci,
      cat: cat as PlantCategory,
      layer: layer as CanopyLayer,
      zones,
      nat: f.includes("nat") || undefined,
      k: f.includes("k") || undefined,
      inv: f.includes("inv") || undefined,
      eat: f.includes("eat") ? true : undefined,
      note: note || undefined,
      tags: tags.length ? tags : undefined,
      guild: guildParts.length ? (guildParts as CompactSeed["guild"]) : undefined,
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
      `zones: ${JSON.stringify(d.zones ?? cfg.zones)}`,
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

  const raw = fs.readFileSync(tsv, "utf-8");
  const rows: CompactSeed[] = [];
  for (const line of raw.split("\n")) {
    const row = parseLine(line);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));

  const body = `/**
 * ${cfg.title}.
 * Generated from data/${prefix}-catalog.tsv — do not edit by hand.
 *   npx tsx scripts/build-state-master-catalog.ts --state=${stateCode}
 */
import type { Plant } from "../schema.js";
import { compactStateSeeds } from "./seed-helpers.js";

const ROWS = compactStateSeeds(
[
${rows.map(compactLine).join("\n")}
],
  "${stateCode}",
);

export const ${cfg.exportName}: Plant[] = ROWS;
`;

  fs.writeFileSync(out, body);
  console.log(`Wrote ${rows.length} new ${stateCode} plants → ${cfg.fileName}`);
}

main();
