/**
 * Build expanded TN/CT comprehensive seed modules from FL catalog + existing state seeds.
 * Zones must overlap the target state's USDA range.
 *
 *   npx tsx scripts/build-state-comprehensive-seeds.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { plantGrowsInState } from "../lib/state-plant-import.js";
import { FL_FOOD_FOREST_COMPREHENSIVE } from "../data/fl-food-forest-comprehensive.js";
import { FL_FOOD_FOREST_PLANTS } from "../data/fl-food-forest-plants.js";
import { FL_FLORIDA_GARDEN_PLANTS } from "../data/fl-florida-garden-plants.js";
import { TN_FOOD_FOREST_PLANTS } from "../data/tn-food-forest-plants.js";
import { CT_FOOD_FOREST_PLANTS } from "../data/ct-food-forest-plants.js";
import type { Plant } from "../schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function slugId(prefix: string, plant: Plant): string {
  const base = plant.id.replace(/^trefle-/, "").replace(/^(tn|ct|fl)-/, "");
  return `${prefix}-${base}`;
}

/** Timber/ornamental natives — not food-forest fruit trees. */
const LANDSCAPE_TREE_GENERA =
  /^(Quercus|Acer|Magnolia|Liriodendron|Pinus|Tsuga|Juniperus|Fraxinus|Ulmus|Platanus|Liquidambar|Nyssa|Populus|Tilia|Fagus|Betula|Chamaecyparis|Carpinus|Ostrya|Sassafras|Platanus)/i;

function fixMisclassifiedCategory(plant: Plant): Plant {
  const genus = plant.scientific_name.split(/\s+/)[0] ?? "";
  if (
    plant.category === "Fruit Tree" &&
    LANDSCAPE_TREE_GENERA.test(genus) &&
    !plant.is_edible
  ) {
    const layer =
      plant.canopy_layer === "Understory" ? "Understory" : "Overstory";
    return {
      ...plant,
      category: "Native Shrub",
      canopy_layer: layer,
      is_edible: false,
    };
  }
  return plant;
}

function remapForState(plant: Plant, stateCode: DesignerStateCode): Plant {
  const prefix = stateCode.toLowerCase();
  const fixed = fixMisclassifiedCategory(plant);
  return {
    ...fixed,
    id: slugId(prefix, fixed),
    native_states: plant.native_states?.length
      ? plant.native_states
      : [stateCode],
    is_florida_native: stateCode === "FL" && fixed.is_florida_native,
    tags: [
      ...new Set([
        "food-forest",
        prefix,
        ...fixed.tags.filter((t) => !["florida", "fl", "tn", "ct"].includes(t)),
        ...(fixed.category === "Native Shrub" &&
        LANDSCAPE_TREE_GENERA.test(fixed.scientific_name.split(/\s+/)[0] ?? "")
          ? ["landscape"]
          : []),
      ]),
    ],
    data_source: fixed.data_source === "ifas" ? "manual" : fixed.data_source,
  };
}

function collectForState(stateCode: DesignerStateCode): Plant[] {
  const sources = [
    ...TN_FOOD_FOREST_PLANTS,
    ...CT_FOOD_FOREST_PLANTS,
    ...FL_FOOD_FOREST_COMPREHENSIVE,
    ...FL_FOOD_FOREST_PLANTS,
    ...FL_FLORIDA_GARDEN_PLANTS,
  ];

  const byId = new Map<string, Plant>();
  for (const p of sources) {
    if (!plantGrowsInState(p, stateCode)) continue;
    const row = remapForState(p, stateCode);
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) =>
    a.common_name.localeCompare(b.common_name),
  );
}

function compactLine(p: Plant): string {
  const zones = JSON.stringify(p.florida_hardiness_zones);
  const spread = `[${p.mature_spread_feet[0]}, ${p.mature_spread_feet[1]}]`;
  const height = `[${p.mature_height_feet[0]}, ${p.mature_height_feet[1]}]`;
  const parts = [
    `id: "${p.id}"`,
    `name: ${JSON.stringify(p.common_name)}`,
    `sci: ${JSON.stringify(p.scientific_name)}`,
    `cat: ${JSON.stringify(p.category)}`,
    `layer: ${JSON.stringify(p.canopy_layer)}`,
    `zones: ${zones}`,
  ];
  if (p.is_kitchen_essential) parts.push("k: true");
  if (p.is_edible) parts.push("eat: true");
  if (
    p.native_states.includes(
      p.id.startsWith("tn-") ? "TN" : p.id.startsWith("ct-") ? "CT" : "FL",
    ) ||
    p.is_florida_native
  ) {
    parts.push("nat: true");
  }
  parts.push(`h: ${height}`, `s: ${spread}`);
  if (p.care_summary?.trim()) {
    parts.push(`note: ${JSON.stringify(p.care_summary.slice(0, 120))}`);
  }
  return `  { ${parts.join(", ")} },`;
}

function writeModule(stateCode: "TN" | "CT", plants: Plant[]) {
  const file = path.join(
    ROOT,
    "data",
    `${stateCode.toLowerCase()}-food-forest-comprehensive.ts`,
  );
  const lines = plants.map(compactLine);
  const body = `/**
 * ${stateCode} food-forest catalog — fruit, berries, herbs, vegetables, natives.
 * Generated from zone-filtered FL/IFAS data + ${stateCode} seeds. Re-run:
 *   npx tsx scripts/build-state-comprehensive-seeds.ts
 */
import type { Plant } from "../schema.js";
import { compactStateSeeds } from "./seed-helpers.js";

const ROWS = compactStateSeeds(
[
${lines.join("\n")}
],
  "${stateCode}",
);

export const ${stateCode}_FOOD_FOREST_COMPREHENSIVE: Plant[] = ROWS;
`;
  fs.writeFileSync(file, body);
  console.log(`Wrote ${plants.length} plants → ${path.basename(file)}`);
}

function main() {
  const tn = collectForState("TN");
  const ct = collectForState("CT");
  writeModule("TN", tn);
  writeModule("CT", ct);
  console.log(`\nTN: ${tn.length} | CT: ${ct.length}`);
}

main();
