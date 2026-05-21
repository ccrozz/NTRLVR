/**
 * @deprecated Import listStateDesignerPlants from state-designer-catalog.js.
 * Kept for backward-compatible imports.
 */
import type { Plant, PlantFilters } from "../schema.js";
import { listStateDesignerPlants } from "./state-designer-catalog.js";

export async function listFloridaDesignerPlants(
  filters: PlantFilters,
): Promise<Plant[]> {
  return listStateDesignerPlants({
    ...filters,
    native_state: filters.native_state ?? "FL",
  });
}
