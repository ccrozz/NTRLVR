import { useInfiniteQuery } from "@tanstack/react-query";
import type { PlantListItem, FilterKey } from "../types";

const API = import.meta.env.VITE_API_URL ?? "";
const PAGE_SIZE = 80;

function filtersToParams(
  search: string,
  categoryFilter: FilterKey | null,
  offset: number,
  trefleLive?: boolean,
): URLSearchParams {
  const p = new URLSearchParams();
  if (search) p.set("search", search);
  if (categoryFilter) p.set("food_forest_group", categoryFilter);
  if (trefleLive) p.set("trefle_live", "true");
  p.set("food_forest_only", "true");
  p.set("state", "FL");
  p.set("for_my_area", "true");
  p.set("limit", String(PAGE_SIZE));
  p.set("offset", String(offset));
  return p;
}

export function usePlants(
  search: string,
  categoryFilter: FilterKey | null,
  opts?: { trefleLive?: boolean; enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ["plants", "food-forest", search, categoryFilter, opts?.trefleLive],
    enabled: opts?.enabled !== false,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<{
      items: PlantListItem[];
      total: number;
      nextOffset: number | null;
    }> => {
      const res = await fetch(
        `${API}/api/plants?${filtersToParams(search, categoryFilter, pageParam, opts?.trefleLive)}`,
      );
      if (!res.ok) throw new Error("Failed to load plants");
      const json = await res.json();
      const items = json.data as PlantListItem[];
      const meta = json.meta as {
        total: number;
        offset: number;
        limit: number;
        has_more: boolean;
      };
      return {
        items,
        total: meta.total,
        nextOffset: meta.has_more ? meta.offset + meta.limit : null,
      };
    },
    getNextPageParam: (last) => last.nextOffset,
    staleTime: 30_000,
  });
}
