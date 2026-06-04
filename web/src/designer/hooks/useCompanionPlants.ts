import { useQuery } from "@tanstack/react-query";
import type { PlantSummary } from "../../types";
import { useDesignerStore } from "../store/useDesignerStore";

const API = import.meta.env.VITE_API_URL ?? "";

async function fetchByNames(
  names: string[],
  stateCode: string,
): Promise<PlantSummary[]> {
  if (!names.length) return [];
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

/** Resolve companion_plants name strings to catalog rows (one request). */
export function useCompanionPlants(names: string[] | undefined, enabled: boolean) {
  const designerState = useDesignerStore((s) => s.designerState);
  const key = names?.join("|") ?? "";
  return useQuery({
    queryKey: ["companion-plants", designerState, key],
    enabled: enabled && Boolean(names?.length),
    staleTime: 60_000,
    queryFn: () => fetchByNames(names!, designerState),
  });
}
