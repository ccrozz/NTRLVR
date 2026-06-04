import { useQuery } from "@tanstack/react-query";
import type { Plant } from "../../types";
import { useDesignerStore } from "../store/useDesignerStore";

const API = import.meta.env.VITE_API_URL ?? "";

async function fetchPlantEntry(
  entry: string,
  stateCode: string,
): Promise<Plant | null> {
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
    state: stateCode,
    limit: "1",
  });
  const byName = await fetch(`${API}/api/designer/plants?${params}`);
  if (!byName.ok) return null;
  const json = await byName.json();
  const hit = json.data?.[0] as Plant | undefined;
  return hit ?? null;
}

export function useResolvePlantEntry(entry: string | null) {
  const designerState = useDesignerStore((s) => s.designerState);
  return useQuery({
    queryKey: ["resolve-plant-entry", designerState, entry],
    enabled: Boolean(entry?.trim()),
    queryFn: () => fetchPlantEntry(entry!, designerState),
  });
}
