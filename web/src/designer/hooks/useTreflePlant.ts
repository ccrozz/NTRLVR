import { useQuery } from "@tanstack/react-query";
import type { Plant } from "../../types";

const API = import.meta.env.VITE_API_URL ?? "";

export function usePlantDetail(plantId: string | null) {
  return useQuery({
    queryKey: ["plant", plantId],
    enabled: Boolean(plantId),
    queryFn: async (): Promise<Plant> => {
      const res = await fetch(`${API}/api/plants/${plantId}`);
      if (!res.ok) throw new Error("Plant not found");
      const json = await res.json();
      return json.data as Plant;
    },
  });
}

export function useEnrichPlant(plantId: string | null) {
  return useQuery({
    queryKey: ["enrich", plantId],
    enabled: Boolean(plantId),
    queryFn: async (): Promise<Plant> => {
      const res = await fetch(`${API}/api/plants/enrich/${plantId}`);
      if (!res.ok) throw new Error("Enrichment failed");
      const json = await res.json();
      return json.data as Plant;
    },
  });
}
