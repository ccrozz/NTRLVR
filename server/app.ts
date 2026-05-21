import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  CanopyLayer,
  GuildFunction,
  PlantCategory,
  PlantFilters,
} from "../schema.js";
import {
  countPlants,
  listGrowingZoneCounts,
  upsertPlant,
} from "../db/plant-repository.js";
import { enrichPlantFromWeb } from "../lib/enrich-plant.js";
import { US_GROWING_ZONES } from "../lib/growing-zones.js";
import { US_STATES } from "../lib/us-states.js";
import {
  applyFinalBenefits,
  needsBenefitsEnrichment,
  plantNeedsAnyEnrichment,
} from "../lib/plant-enrichment.js";
import { dbBackend } from "../db/db-config.js";
import { applyDesignerProfile } from "../lib/designer-plant-profiles.js";
import {
  enrichSeedPlant,
  listPlantsWithTrefle,
  resolvePlantById,
} from "../lib/plant-list-service.js";
import { getTreflePlant, mapTrefleDetailToPlant } from "../lib/trefle-api.js";
import {
  generateCompanionReason,
  generateCompanionReasonsBatch,
  type CompanionReasonPlant,
} from "../lib/companion-reason.js";
import { generateFoodForestLayout } from "../lib/food-forest-layout.js";
import { generateGardenFromOnboarding } from "../lib/garden-generate.js";
import {
  type GardenOnboardingAnswers,
  type OnboardingSunlight,
} from "../lib/garden-onboarding.js";
import {
  DEFAULT_DESIGNER_STATE,
  isDesignerStateCode,
  type DesignerStateCode,
} from "../lib/designer-states.js";
import { listStateDesignerPlants } from "../lib/state-designer-catalog.js";
import {
  isStateRegionId,
  resolveOnboardingHardinessZone,
} from "../lib/state-onboarding-regions.js";
import {
  normalizePreferences,
  type GardenPreferences,
} from "../lib/food-forest-questionnaire.js";
import { loadEnv } from "../lib/load-env.js";

loadEnv();

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/api/states", (c) => {
  return c.json({
    data: US_STATES.map((s) => ({
      code: s.code,
      name: s.name,
      hardiness_zones: s.hardiness_zones,
      primary_zone:
        s.hardiness_zones[Math.floor(s.hardiness_zones.length / 2)] ?? "",
      zone_range:
        s.hardiness_zones.length > 1
          ? `${s.hardiness_zones[0]}–${s.hardiness_zones[s.hardiness_zones.length - 1]}`
          : (s.hardiness_zones[0] ?? ""),
    })),
  });
});

app.get("/api/growing-zones", async (c) => {
  const counts = await listGrowingZoneCounts();
  const countMap = new Map(counts.map((r) => [r.zone, r.count]));

  const zones = US_GROWING_ZONES.map((zone) => ({
    zone,
    count: countMap.get(zone) ?? 0,
  }));

  return c.json({
    data: zones,
    meta: { total_plants: await countPlants() },
  });
});

function parsePlantFilters(c: {
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
    for_my_area:
      q("for_my_area") === "true" ||
      (q("state") != null &&
        q("native_to_state") !== "true" &&
        q("for_my_area") !== "false"),
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

app.get("/api/plants", async (c) => {
  const parsed = parsePlantFilters(c);
  const { trefleLive, ...filters } = parsed;
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  try {
    const { data, total } = await listPlantsWithTrefle(filters, {
      trefleLive,
    });

    return c.json({
      data,
      meta: {
        total,
        limit,
        offset,
        has_more: offset + data.length < total,
      },
    });
  } catch (e) {
    return c.json(
      {
        error: e instanceof Error ? e.message : "Failed to list plants",
      },
      500,
    );
  }
});

app.get("/api/plants/enrich/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const plant = await enrichSeedPlant(id);
    if (!plant) {
      return c.json({ error: `Plant '${id}' not found in seed catalog.` }, 404);
    }
    return c.json({ data: plant });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Enrichment failed" },
      500,
    );
  }
});

app.get("/api/plants/:id", async (c) => {
  const id = c.req.param("id");
  const numeric = /^\d+$/.test(id);

  if (numeric) {
    try {
      const detail = await getTreflePlant(parseInt(id, 10));
      const plant = applyDesignerProfile(mapTrefleDetailToPlant(detail));
      return c.json({ data: plant, meta: { enriched: true, sources: ["trefle"] } });
    } catch {
      return c.json({ error: `Trefle plant ${id} not found.` }, 404);
    }
  }

  let plant = await resolvePlantById(id);

  if (!plant) {
    return c.json({ error: `Plant with id '${id}' not found.` }, 404);
  }

  const forceEnrich = c.req.query("enrich") === "true";
  const shouldEnrich = forceEnrich || plantNeedsAnyEnrichment(plant);
  let sources: string[] = [];

  if (shouldEnrich && plant.data_source !== "trefle") {
    const result = await enrichPlantFromWeb(plant);
    plant = result.plant;
    sources = result.sources;
    await upsertPlant(plant);
  } else if (needsBenefitsEnrichment(plant)) {
    plant = applyFinalBenefits(plant);
    await upsertPlant(plant);
  }

  return c.json({
    data: applyDesignerProfile(plant),
    meta: {
      enriched: sources.length > 0,
      sources,
    },
  });
});

async function countPlantsForSunlight(
  sun: OnboardingSunlight,
  hardiness_zone = "10a",
  stateCode: DesignerStateCode = DEFAULT_DESIGNER_STATE,
): Promise<number> {
  const plants = await listStateDesignerPlants({
    exclude_invasive: true,
    native_state: stateCode,
    for_my_area: true,
    hardiness_zone,
  });
  return plants.filter((p) => {
    const s = applyDesignerProfile(p).sunlight;
    switch (sun) {
      case "full":
        return s === "Full Sun" || s === "Adaptable";
      case "partial":
        return (
          s === "Full Sun" || s === "Partial Shade" || s === "Adaptable"
        );
      case "dappled":
        return (
          s === "Partial Shade" || s === "Adaptable" || s === "Full Shade"
        );
      case "shade":
        return (
          s === "Partial Shade" || s === "Full Shade" || s === "Adaptable"
        );
    }
  }).length;
}

app.get("/api/garden/sunlight-count", async (c) => {
  const raw = c.req.query("sunlight") ?? "full";
  const allowed: OnboardingSunlight[] = [
    "full",
    "partial",
    "dappled",
    "shade",
  ];
  const sunlight = allowed.includes(raw as OnboardingSunlight)
    ? (raw as OnboardingSunlight)
    : "full";
  const stateParam = c.req.query("state")?.trim().toUpperCase() ?? "";
  const stateCode = isDesignerStateCode(stateParam)
    ? stateParam
    : DEFAULT_DESIGNER_STATE;
  const hardiness_zone =
    c.req.query("hardiness_zone")?.trim() ||
    resolveOnboardingHardinessZone(stateCode, {});
  return c.json({
    data: {
      count: await countPlantsForSunlight(sunlight, hardiness_zone, stateCode),
      sunlight,
      hardiness_zone,
      state: stateCode,
    },
  });
});

app.post("/api/garden/generate", async (c) => {
  let body: Partial<GardenOnboardingAnswers>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  const goals = Array.isArray(body.goals)
    ? body.goals.filter(Boolean)
    : [];
  const gardenStyles = [
    "food_forest",
    "kitchen_garden",
    "pollinator",
    "visual",
    "easy_care",
  ] as const;
  const garden_style =
    body.garden_style &&
    gardenStyles.includes(body.garden_style as (typeof gardenStyles)[number])
      ? body.garden_style
      : "food_forest";

  if (
    !body.property_type ||
    !body.space_size ||
    !goals.length ||
    !body.sunlight ||
    !body.maintenance ||
    !body.water ||
    !body.experience
  ) {
    return c.json(
      { error: "Missing required onboarding fields (goals must include at least one)." },
      400,
    );
  }

  const designer_state = isDesignerStateCode(body.designer_state ?? "")
    ? (body.designer_state!.toUpperCase() as DesignerStateCode)
    : DEFAULT_DESIGNER_STATE;
  const state_region =
    typeof body.state_region === "string" &&
    isStateRegionId(designer_state, body.state_region)
      ? body.state_region
      : typeof body.florida_region === "string" &&
          designer_state === "FL" &&
          isStateRegionId("FL", body.florida_region)
        ? body.florida_region
        : undefined;
  const hardiness_zone = resolveOnboardingHardinessZone(designer_state, {
    hardiness_zone: body.hardiness_zone,
    state_region,
    florida_region: body.florida_region as GardenOnboardingAnswers["florida_region"],
  });

  const answers: GardenOnboardingAnswers = {
    garden_style: garden_style as GardenOnboardingAnswers["garden_style"],
    property_type: body.property_type,
    space_size: body.space_size,
    goals: goals as GardenOnboardingAnswers["goals"],
    sunlight: body.sunlight,
    maintenance: body.maintenance,
    water: body.water,
    preferences: Array.isArray(body.preferences)
      ? body.preferences.filter(Boolean)
      : [],
    experience: body.experience,
    designer_state,
    state_region,
    florida_region:
      designer_state === "FL"
        ? (state_region as GardenOnboardingAnswers["florida_region"])
        : body.florida_region,
    hardiness_zone,
    space_source: body.space_source,
    bed_width_feet:
      typeof body.bed_width_feet === "number" ? body.bed_width_feet : undefined,
    bed_height_feet:
      typeof body.bed_height_feet === "number"
        ? body.bed_height_feet
        : undefined,
    canvas_zone_id:
      typeof body.canvas_zone_id === "string"
        ? body.canvas_zone_id.trim()
        : undefined,
    planting_density:
      body.planting_density === "spacious" ||
      body.planting_density === "balanced" ||
      body.planting_density === "dense"
        ? body.planting_density
        : undefined,
  };

  try {
    const result = await generateGardenFromOnboarding(answers);
    return c.json({ data: result });
  } catch (e) {
    return c.json(
      {
        error:
          e instanceof Error ? e.message : "Garden generation failed.",
      },
      500,
    );
  }
});

app.post("/api/food-forest-layout", async (c) => {
  let body: {
    hardiness_zone?: string;
    width_feet?: number;
    height_feet?: number;
    target_count?: number;
    preferences?: Partial<GardenPreferences>;
    /** @deprecated */
    goals?: string[];
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  const hardiness_zone = body.hardiness_zone?.trim() || "10a";
  const width_feet = Math.min(80, Math.max(6, Number(body.width_feet) || 20));
  const height_feet = Math.min(80, Math.max(6, Number(body.height_feet) || 20));
  const preferences = normalizePreferences(body.preferences);

  try {
    const result = await generateFoodForestLayout({
      hardiness_zone,
      preferences,
      width_feet,
      height_feet,
      target_count: body.target_count,
    });
    return c.json(result);
  } catch (e) {
    return c.json(
      {
        error:
          e instanceof Error ? e.message : "Food forest layout failed.",
      },
      500,
    );
  }
});

app.post("/api/companion-reasons/batch", async (c) => {
  let body: { host_id?: string; companion_ids?: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  const hostId = body.host_id?.trim();
  const companionIds = (body.companion_ids ?? []).filter(Boolean);
  if (!hostId || !companionIds.length) {
    return c.json({ error: "host_id and companion_ids are required." }, 400);
  }

  try {
    const reasons = await generateCompanionReasonsBatch(hostId, companionIds);
    return c.json({ reasons });
  } catch (e) {
    return c.json(
      {
        error:
          e instanceof Error ? e.message : "Batch companion reasons failed.",
      },
      500,
    );
  }
});

app.post("/api/companion-reason", async (c) => {
  let body: {
    plant_a?: CompanionReasonPlant;
    plant_b?: CompanionReasonPlant;
    avoid?: boolean;
    fast?: boolean;
    use_ai?: boolean;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  const plantA = body.plant_a;
  const plantB = body.plant_b;
  if (!plantA?.common_name || !plantB?.common_name) {
    return c.json({ error: "plant_a and plant_b are required." }, 400);
  }

  try {
    const reason = await generateCompanionReason(plantA, plantB, {
      avoid: body.avoid === true,
      fast: body.fast === true,
      useAi: body.use_ai === true,
    });
    return c.json({ reason });
  } catch (e) {
    return c.json(
      {
        error:
          e instanceof Error ? e.message : "Companion reason generation failed.",
      },
      500,
    );
  }
});
