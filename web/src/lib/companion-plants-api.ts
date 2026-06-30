import type { PlantSummary } from "../types";

const API = import.meta.env.VITE_API_URL ?? "";

/** Resolve companion_plants name strings to catalog rows for a designer state. */
export async function fetchCompanionPlantsByName(
  names: string[],
  stateCode: string,
): Promise<PlantSummary[]> {
  if (!names.length || !stateCode) return [];
  const params = new URLSearchParams({
    names: names.join(","),
    food_forest_only: "true",
    state: stateCode,
    limit: String(Math.max(names.length, 8)),
  });
  const res = await fetch(`${API}/api/designer/plants?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as PlantSummary[];
}
