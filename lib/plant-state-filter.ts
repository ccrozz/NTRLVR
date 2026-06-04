/**
 * Match plants to a US state for catalog browse (zones, natives, harvest tags).
 */
import type { Plant } from "../schema.js";
import { plantIsNativeToState } from "./plant-native-status.js";
import { stateByCode } from "./us-states.js";
import { plantZonesOverlapState } from "./us-states.js";
import { stateTag } from "./state-plant-import.js";
import type { DesignerStateCode } from "./designer-states.js";
import { isDesignerStateCode } from "./designer-states.js";

export function plantMatchesStateCatalog(
  plant: Plant,
  stateCode: string,
): boolean {
  const st = stateCode.toUpperCase();
  const zones = plant.florida_hardiness_zones ?? [];
  if (zones.length && plantZonesOverlapState(zones, st)) return true;

  if (plantIsNativeToState(plant, st)) return true;

  const tag = stateTag(
    isDesignerStateCode(st) ? (st as DesignerStateCode) : "FL",
  );
  if ((plant.tags ?? []).some((t) => t.toLowerCase() === tag)) return true;

  if (plant.id.startsWith(`${tag}-`)) return true;

  return false;
}

/** Extra SQL fragment (sqlite @params) appended inside for_my_area parentheses. */
export function sqliteStateTagClause(stateCode: string): {
  sql: string;
  params: Record<string, string>;
} {
  const st = stateCode.toUpperCase();
  const tag = st.toLowerCase();
  const parts = [
    `EXISTS (SELECT 1 FROM json_each(tags) WHERE LOWER(value) = LOWER(@state_tag_${tag}))`,
  ];
  const params: Record<string, string> = {};
  params[`state_tag_${tag}`] = tag;

  if (isDesignerStateCode(st)) {
    parts.push(`id LIKE '${tag}-%'`);
  }

  return { sql: parts.join(" OR "), params };
}

/** Extra OR branches for Postgres $n params; returns { sqlParts, params }. */
export function stateHasHardinessZones(stateCode: string): boolean {
  return (stateByCode(stateCode)?.hardiness_zones.length ?? 0) > 0;
}
