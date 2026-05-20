import { useQuery } from "@tanstack/react-query";
import type { CanopyLayer, GuildFunction, PlantCategory } from "../../types";

const API = import.meta.env.VITE_API_URL ?? "";

export type ReasonPlantPayload = {
  id: string;
  common_name: string;
  scientific_name: string;
  guild_functions: GuildFunction[];
  canopy_layer: CanopyLayer;
  category: PlantCategory;
};

export function useCompanionReason(
  plantA: ReasonPlantPayload | null,
  plantB: ReasonPlantPayload | null,
  avoid = false,
  enabled = true,
  fast = true,
) {
  return useQuery({
    queryKey: [
      "companion-reason",
      "v4",
      fast ? "fast" : "ai",
      plantA?.id,
      plantB?.id,
      avoid,
    ],
    enabled: enabled && Boolean(plantA && plantB),
    staleTime: Infinity,
    queryFn: async (): Promise<string> => {
      const res = await fetch(`${API}/api/companion-reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_a: plantA,
          plant_b: plantB,
          avoid,
          fast,
        }),
      });
      if (!res.ok) {
        throw new Error("Could not load companion advice");
      }
      const json = (await res.json()) as { reason?: string };
      return json.reason ?? "";
    },
  });
}
