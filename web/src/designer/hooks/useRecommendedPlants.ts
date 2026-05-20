import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedPlants } from "../lib/garden-onboarding-run";

export function useRecommendedPlants(ids: string[] | null) {
  return useQuery({
    queryKey: ["plants", "recommendations", ids?.join(",") ?? ""],
    enabled: Boolean(ids?.length),
    queryFn: () => fetchRecommendedPlants(ids!),
    staleTime: 60_000,
  });
}
