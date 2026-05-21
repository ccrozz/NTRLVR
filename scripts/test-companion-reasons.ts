import { buildEducationalCompanionReason } from "../lib/companion-reason-copy.js";
import { resolveReasonPlant } from "../lib/companion-reason.js";

const hostId = process.argv[2] ?? "tn-pawpaw";
const host = resolveReasonPlant({
  id: hostId,
  common_name: hostId,
  scientific_name: "",
  guild_functions: [],
  canopy_layer: "Overstory",
  category: "Fruit Tree",
});

const plant = resolveReasonPlant({
  id: hostId,
  common_name: hostId,
  scientific_name: "",
  guild_functions: [],
  canopy_layer: "Overstory",
  category: "Fruit Tree",
});
console.log("HOST", host.common_name, host.guild_functions, host.canopy_layer);

const ids = (process.argv.slice(3).length ? process.argv.slice(3) : [
  "fl-moringa",
  "comfrey",
  "lemongrass",
  "tn-pecan",
]).filter(Boolean);

for (const cid of ids) {
  const c = resolveReasonPlant({
    id: cid,
    common_name: cid,
    scientific_name: "",
    guild_functions: [],
    canopy_layer: "Herbaceous",
    category: "Vegetable",
  });
  const r = buildEducationalCompanionReason(host, c);
  console.log("\n---", cid, c.guild_functions, c.canopy_layer);
  console.log(r);
}
