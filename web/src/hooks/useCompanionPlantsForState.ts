import { useQuery } from "@tanstack/react-query";
import { fetchCompanionPlantsByName } from "../lib/companion-plants-api";

/** Resolve companion_plants name strings to catalog rows (one request). */
export function useCompanionPlantsForState(
  names: string[] | undefined,
  stateCode: string,
  enabled: boolean,
) {
  const key = names?.join("|") ?? "";
  return useQuery({
    queryKey: ["companion-plants", stateCode, key],
    enabled: enabled && Boolean(stateCode) && Boolean(names?.length),
    staleTime: 60_000,
    queryFn: () => fetchCompanionPlantsByName(names!, stateCode),
  });
}
