import type {
  CanopyLayer,
  GuildFunction,
  PlantCategory,
  PlantFilters,
} from "../schema.js";

export function parsePlantFilters(c: {
  req: { query: (key: string) => string | undefined };
}): PlantFilters & { trefleLive?: boolean } {
  const searchParams = c.req.query.bind(c.req);
  const q = (key: string) => searchParams(key);

  return {
    search: q("search"),
    category: q("category") as PlantCategory | undefined,
    canopy_layer: q("canopy_layer") as CanopyLayer | undefined,
    florida_native_only:
      q("florida_native") === "true" || q("florida_native_only") === "true",
    kitchen_essentials_only:
      q("kitchen_only") === "true" || q("kitchen_essentials_only") === "true",
    edible_only: q("edible_only") === "true",
    exclude_invasive: q("exclude_invasive") === "true",
    native_state: q("state") ?? q("native_state"),
    native_to_state_only: q("native_to_state") === "true",
    /** Only when the client sends for_my_area=true (designer sets this explicitly). */
    for_my_area:
      q("for_my_area") === "true"
        ? true
        : q("for_my_area") === "false"
          ? false
          : undefined,
    us_only: q("us_only") === "true",
    food_forest_only:
      q("food_forest") === "true" || q("food_forest_only") === "true",
    food_forest_group: q("food_forest_group") ?? q("designer_group"),
    hardiness_zone: q("growing_zone") ?? q("hardiness_zone"),
    guild_function: q("guild_function") as GuildFunction | undefined,
    ids: q("ids")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    names: q("names")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    limit: parseInt(q("limit") ?? "100", 10),
    offset: parseInt(q("offset") ?? "0", 10),
    trefleLive: q("trefle_live") === "true",
  };
}
