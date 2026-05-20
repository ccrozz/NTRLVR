import { useQuery } from "@tanstack/react-query";
import type { Plant } from "../../types";

const API = import.meta.env.VITE_API_URL ?? "";

async function fetchPlantEntry(entry: string): Promise<Plant | null> {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  const byId = await fetch(`${API}/api/plants/${encodeURIComponent(trimmed)}`);
  if (byId.ok) {
    const json = await byId.json();
    return json.data as Plant;
  }

  const params = new URLSearchParams({
    names: trimmed,
    food_forest_only: "true",
    limit: "1",
  });
  const byName = await fetch(`${API}/api/plants?${params}`);
  if (!byName.ok) return null;
  const json = await byName.json();
  const hit = json.data?.[0] as Plant | undefined;
  return hit ?? null;
}

export function useResolvePlantEntry(entry: string | null) {
  return useQuery({
    queryKey: ["resolve-plant-entry", entry],
    enabled: Boolean(entry?.trim()),
    queryFn: () => fetchPlantEntry(entry!),
  });
}
