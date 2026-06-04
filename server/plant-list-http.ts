import { parsePlantFilters } from "./parse-plant-filters.js";
import { requestSearchParams } from "./http-utils.js";

export const apiRouteConfig = { maxDuration: 60 };

export async function handlePlantListHttp(
  req: Request,
  mode: "catalog" | "designer",
): Promise<Response> {
  const params = requestSearchParams(req);
  const query = (key: string) => params.get(key) ?? undefined;
  const parsed = parsePlantFilters({ req: { query } });
  const { trefleLive, ...filters } = parsed;
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const { listCatalogPlants, listDesignerPlants } = await import(
    "../lib/plant-list-service.js"
  );

  if (mode === "catalog") {
    filters.food_forest_only = undefined;
    // When a state is selected, filter to plants for that state unless client opts out.
    if (filters.for_my_area === undefined) {
      filters.for_my_area = Boolean(filters.native_state);
    }
    const { data, total } = await listCatalogPlants(filters, { trefleLive });
    return Response.json({
      data,
      meta: {
        pool: "catalog",
        total,
        limit,
        offset,
        has_more: offset + data.length < total,
      },
    });
  }

  filters.exclude_invasive = true;
  if (!filters.native_state) filters.native_state = "FL";
  if (filters.for_my_area === undefined) filters.for_my_area = true;
  const { data, total } = await listDesignerPlants(filters, { search: filters.search });
  return Response.json({
    data,
    meta: {
      pool: "designer",
      state: filters.native_state,
      total,
      limit,
      offset,
      has_more: offset + data.length < total,
    },
  });
}
