import type {
  GrowingZoneCount,
  Plant,
  PlantFilters,
  PlantsResponse,
  UsStateOption,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function toQuery(filters: PlantFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.canopy_layer) params.set("canopy_layer", filters.canopy_layer);
  if (filters.edible_only) params.set("edible_only", "true");
  if (filters.exclude_invasive) params.set("exclude_invasive", "true");
  if (filters.state) params.set("state", filters.state);
  if (filters.native_to_state) params.set("native_to_state", "true");
  if (filters.for_my_area === false) params.set("for_my_area", "false");
  if (filters.growing_zone) params.set("growing_zone", filters.growing_zone);
  params.set("limit", String(filters.limit ?? 24));
  params.set("offset", String(filters.offset ?? 0));
  return params.toString();
}

export async function fetchPlants(
  filters: PlantFilters,
): Promise<PlantsResponse> {
  const res = await fetch(`${API_BASE}/api/plants?${toQuery(filters)}`);
  if (!res.ok) throw new Error(`Failed to load plants (${res.status})`);
  return res.json() as Promise<PlantsResponse>;
}

export type PlantDetailResponse = {
  data: Plant;
  meta?: { enriched?: boolean; sources?: string[] };
};

export async function fetchPlant(
  id: string,
  options?: { enrich?: boolean },
): Promise<PlantDetailResponse> {
  const params = options?.enrich ? "?enrich=true" : "";
  const res = await fetch(
    `${API_BASE}/api/plants/${encodeURIComponent(id)}${params}`,
  );
  if (!res.ok) throw new Error(`Plant not found (${res.status})`);
  return res.json() as Promise<PlantDetailResponse>;
}

export async function fetchStates(): Promise<UsStateOption[]> {
  const res = await fetch(`${API_BASE}/api/states`);
  if (!res.ok) throw new Error("Failed to load states");
  const json = (await res.json()) as { data: UsStateOption[] };
  return json.data;
}

export async function fetchGrowingZones(): Promise<GrowingZoneCount[]> {
  const res = await fetch(`${API_BASE}/api/growing-zones`);
  if (!res.ok) throw new Error("Failed to load growing zones");
  const json = (await res.json()) as { data: GrowingZoneCount[] };
  return json.data;
}

export async function fetchHealth(): Promise<{ plant_count: number }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error("API unavailable");
  return res.json() as Promise<{ plant_count: number }>;
}
