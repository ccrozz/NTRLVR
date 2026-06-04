import type { Context } from "hono";
import { parsePlantFilters } from "./parse-plant-filters.js";

export async function respondPlantList(c: Context, mode: "catalog" | "designer") {
  const { handlePlantListHttp } = await import("./plant-list-http.js");
  return handlePlantListHttp(c.req.raw, mode);
}
