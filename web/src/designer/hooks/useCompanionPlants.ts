import { useQuery } from "@tanstack/react-query";
import { fetchCompanionPlantsByName } from "../../lib/companion-plants-api";
import { useDesignerStore } from "../store/useDesignerStore";

/** Resolve companion_plants name strings to catalog rows (one request). */
export function useCompanionPlants(names: string[] | undefined, enabled: boolean) {
  const designerState = useDesignerStore((s) => s.designerState);
  const key = names?.join("|") ?? "";
  return useQuery({
    queryKey: ["companion-plants", designerState, key],
    enabled: enabled && Boolean(names?.length),
    staleTime: 60_000,
    queryFn: () => fetchCompanionPlantsByName(names!, designerState),
  });
}
