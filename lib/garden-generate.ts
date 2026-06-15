import {
  generateFoodForestLayout,
  type FoodForestLayoutResponse,
} from "./food-forest-layout.js";
import type { GardenPreferences } from "./food-forest-questionnaire.js";
import type { GardenStyle } from "./food-forest-questionnaire.js";
import {
  aiPickingRulesForGardenStyle,
  filterCatalogForGardenStyle,
  filterIdsForGardenStyle,
  topUpIdsForGardenStyle,
} from "./garden-style-catalog.js";
import {
  foodForestCanvasTreesOnly,
  resolveGardenPlantTarget,
} from "./food-forest-questionnaire.js";
import {
  onboardingProfileText,
  onboardingToGardenPreferences,
  resolveOnboardingBedDimensions,
  type GardenOnboardingAnswers,
} from "./garden-onboarding.js";
import { resolveOnboardingHardinessZone } from "./state-onboarding-regions.js";
import { listStateDesignerPlants } from "./state-designer-catalog.js";
import {
  DEFAULT_DESIGNER_STATE,
  type DesignerStateCode,
} from "./designer-states.js";
import { designerStateConfig } from "./designer-states.js";
import { plantToSummary } from "../db/plant-repository.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import {
  dedupeOrderedIds,
  dedupeOrderedIdsByName,
} from "./plant-dedupe.js";

export type GardenGenerateResult = {
  garden_name: string;
  garden_description: string;
  design_philosophy: string;
  plant_ids: string[];
  source: "ai" | "heuristic";
  message?: string;
  hardiness_zone: string;
  width_feet: number;
  height_feet: number;
  target_count: number;
  preferences: GardenPreferences;
  designer_state?: DesignerStateCode;
};

type CatalogRow = {
  id: string;
  common_name: string;
  scientific_name: string;
  canopy_layer: string;
  category: string;
  radius_ft: number;
  sunlight: string;
  edible: boolean;
  native: boolean;
  tags: string[];
  is_kitchen_essential: boolean;
};

async function loadCatalogForOnboarding(
  zone: string,
  sunlight: GardenOnboardingAnswers["sunlight"],
  stateCode: DesignerStateCode = DEFAULT_DESIGNER_STATE,
): Promise<CatalogRow[]> {
  const plants = await listStateDesignerPlants({
    hardiness_zone: zone,
    exclude_invasive: true,
    native_state: stateCode,
    for_my_area: true,
  });

  const sunFilter = (p: ReturnType<typeof applyDesignerProfile>) => {
    const s = p.sunlight;
    switch (sunlight) {
      case "full":
        return s === "Full Sun" || s === "Adaptable";
      case "partial":
        return s === "Full Sun" || s === "Partial Shade" || s === "Adaptable";
      case "dappled":
        return (
          s === "Partial Shade" || s === "Adaptable" || s === "Full Shade"
        );
      case "shade":
        return s === "Partial Shade" || s === "Full Shade" || s === "Adaptable";
    }
  };

  return plants
    .filter(sunFilter)
    .map((p) => {
      const s = plantToSummary(applyDesignerProfile(p));
      return {
        id: s.id,
        common_name: s.common_name,
        scientific_name: s.scientific_name,
        canopy_layer: s.canopy_layer,
        category: s.category,
        radius_ft: s.canvas_radius_feet || 3,
        sunlight: p.sunlight,
        edible: p.is_edible,
        native: s.is_florida_native,
        tags: p.tags,
        is_kitchen_essential: p.is_kitchen_essential,
      };
    });
}

function catalogLines(catalog: CatalogRow[]): string {
  return catalog
    .slice(0, 140)
    .map(
      (r) =>
        `${r.id}\t${r.common_name}\t${r.canopy_layer}\t${r.category}\t${r.radius_ft}`,
    )
    .join("\n");
}

function defaultGardenCopy(
  answers: GardenOnboardingAnswers,
): Pick<
  GardenGenerateResult,
  "garden_name" | "garden_description" | "design_philosophy"
> {
  const primary = answers.goals[0];
  const names: Record<string, string> = {
    food_production: "The Weekly Harvest Garden",
    wildlife: "The Living Sanctuary",
    pollinator: "The Pollinator Parade",
    medicinal: "The Healing Hedge",
    savings: "The Grocery-Saver Guild",
    regenerative: "The Soil-Builder's Plot",
    aesthetic: "The Peaceful Green Room",
    low_maintenance: "The Easy-Eden Garden",
  };
  const stateName =
    designerStateConfig(answers.designer_state ?? DEFAULT_DESIGNER_STATE)?.name ??
    "Florida";
  const style = answers.garden_style;
  if (style === "food_forest") {
    return {
      garden_name: "Your Food Forest Canopy",
      garden_description:
        `A ${stateName} food forest starter with fruit trees spaced for real-world canopy room — tuned to your light, water, and goals.`,
      design_philosophy:
        "We place fruit trees on the map first so spacing and shade make sense. Add shrubs, herbs, and support plants from Browse Plants as you build out each guild.",
    };
  }
  if (style === "kitchen_garden") {
    return {
      garden_name: "Your Kitchen Garden",
      garden_description:
        `Herbs, vegetables, and everyday cooking crops for your ${stateName} bed — picked for your sun, water, and how much you want to tend it.`,
      design_philosophy:
        "Everything here is harvestable for the kitchen: greens, tomatoes, peppers, beans, and herbs — no fruit trees on the canvas.",
    };
  }
  if (style === "pollinator") {
    return {
      garden_name: "Your Pollinator Garden",
      garden_description:
        `Flowers and nectar plants that bring bees, butterflies, and hummingbirds to your ${stateName} yard.`,
      design_philosophy:
        "Bloom layers from ground to shrub height — perennial flowers, annuals, and flowering herbs without orchard trees.",
    };
  }
  if (style === "visual") {
    return {
      garden_name: "Your Visual Garden",
      garden_description:
        `The prettiest ornamental plants for your ${stateName} space — color, texture, and fragrance from the window or patio.`,
      design_philosophy:
        "Beauty-first planting: flowers, foliage, and landscape plants — no fruit trees cluttering the view.",
    };
  }

  return {
    garden_name: names[primary ?? "food_production"] ?? `Your ${stateName} Garden`,
    garden_description:
      `A layered ${stateName} planting tuned to your light, water, and how much time you want to spend tending it — built from species that actually thrive in your climate.`,
    design_philosophy:
      "Stack canopy, shrub, and ground layers so each plant supports the next: shade where you need it, pollinators on the edges, and food within easy reach.",
  };
}

async function callAnthropicGarden(
  answers: GardenOnboardingAnswers,
  catalog: CatalogRow[],
  target: number,
  zone: string,
  widthFeet: number,
  heightFeet: number,
  preferences: GardenPreferences,
): Promise<{
  garden_name: string;
  garden_description: string;
  design_philosophy: string;
  plant_ids: string[];
  message?: string;
} | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const validIds = new Set(catalog.map((r) => r.id));
  const profile = onboardingProfileText(answers);
  const density = preferences.density ?? "balanced";

  const stateName =
    designerStateConfig(answers.designer_state ?? DEFAULT_DESIGNER_STATE)?.name ??
    "Florida";
  const styleRules = aiPickingRulesForGardenStyle(
    answers.garden_style,
    target,
    density,
  );

  const system = `You are an expert permaculture designer specializing in ${stateName} food forests and edible landscapes. You have deep knowledge of plant guilds, companion planting, canopy layering, and ${stateName}-specific growing conditions. You give practical, specific, enthusiastic advice that makes beginners feel capable and experts feel respected.

Pick plants ONLY from the catalog (first column = id). Return valid JSON only, no markdown:
{
  "garden_name": "poetic specific name",
  "garden_description": "2-3 warm sentences describing the vision",
  "design_philosophy": "2-3 sentences on guild structure and layering strategy",
  "plant_ids": ["id1","id2",...],
  "message": "one encouraging sentence"
}

Rules:
${styleRules}
- USDA zone ${zone}, bed ${widthFeet}×${heightFeet} ft, density ${density}.
- Match sunlight and maintenance from the profile; favor perennials for minimal maintenance.
- ${answers.experience === "beginner" ? "Favor foolproof, forgiving species." : ""}
- ${answers.experience === "advanced" ? "Include diverse guild roles and interesting pairings." : ""}`;

  const user = `${profile}\n\nCatalog (id, name, layer, category, radius_ft):\n${catalogLines(catalog)}\n\nDesign this personalized ${stateName} garden.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 1600,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(
      `[garden-generate] Anthropic ${res.status}: ${errBody.slice(0, 200)}`,
    );
    return null;
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) return null;

  const parse = (raw: string) => {
    const parsed = JSON.parse(raw) as {
      garden_name?: string;
      garden_description?: string;
      design_philosophy?: string;
      plant_ids?: string[];
      message?: string;
    };
    let plant_ids = (parsed.plant_ids ?? []).filter((id) => validIds.has(id));
    plant_ids = dedupeOrderedIds(plant_ids);
    if (!plant_ids.length) return null;
    const copy = defaultGardenCopy(answers);
    return {
      garden_name: parsed.garden_name?.trim() || copy.garden_name,
      garden_description:
        parsed.garden_description?.trim() || copy.garden_description,
      design_philosophy:
        parsed.design_philosophy?.trim() || copy.design_philosophy,
      plant_ids,
      message: parsed.message?.trim(),
    };
  };

  try {
    return parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function generateGardenFromOnboarding(
  answers: GardenOnboardingAnswers,
): Promise<GardenGenerateResult> {
  const stateCode = (answers.designer_state ?? DEFAULT_DESIGNER_STATE) as DesignerStateCode;
  const hardiness_zone = resolveOnboardingHardinessZone(stateCode, answers);
  const preferences = onboardingToGardenPreferences(answers);
  const density = preferences.density ?? "balanced";
  const { widthFeet, heightFeet, areaSqFt } =
    resolveOnboardingBedDimensions(answers);
  const foodForestTreesOnly =
    answers.garden_style === "food_forest" &&
    foodForestCanvasTreesOnly(density);
  const target = resolveGardenPlantTarget(
    areaSqFt,
    preferences,
    answers.garden_style,
  );

  let catalog = await loadCatalogForOnboarding(
    hardiness_zone,
    answers.sunlight,
    stateCode,
  );
  if (catalog.length < 40) {
    catalog = await loadCatalogForOnboarding(hardiness_zone, "partial", stateCode);
  }
  if (!catalog.length) {
    throw new Error("No plants in catalog for this zone and sunlight.");
  }

  catalog = filterCatalogForGardenStyle(
    catalog,
    answers.garden_style,
    stateCode,
    foodForestTreesOnly ? 3 : 10,
    density,
  );

  const copy = defaultGardenCopy(answers);
  const useAi =
    process.env.FOOD_FOREST_LAYOUT_AI !== "false" &&
    Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  let plant_ids: string[] = [];
  let source: "ai" | "heuristic" = "heuristic";
  let message: string | undefined;
  let garden_name = copy.garden_name;
  let garden_description = copy.garden_description;
  let design_philosophy = copy.design_philosophy;

  if (useAi) {
    const fromAi = await callAnthropicGarden(
      answers,
      catalog,
      target,
      hardiness_zone,
      widthFeet,
      heightFeet,
      preferences,
    );
    const aiMin = foodForestTreesOnly ? Math.min(2, target) : Math.min(8, target);
    if (fromAi && fromAi.plant_ids.length >= aiMin) {
      plant_ids = fromAi.plant_ids.slice(0, target);
      source = "ai";
      garden_name = fromAi.garden_name;
      garden_description = fromAi.garden_description;
      design_philosophy = fromAi.design_philosophy;
      message = fromAi.message;
    }
  }

  const layoutMin = foodForestTreesOnly ? Math.min(2, target) : Math.min(8, target);
  if (plant_ids.length < layoutMin) {
    const layout: FoodForestLayoutResponse = await generateFoodForestLayout({
      hardiness_zone,
      native_state: stateCode,
      width_feet: widthFeet,
      height_feet: heightFeet,
      preferences,
      target_count: target,
    });
    plant_ids = layout.plant_ids;
    source = layout.source;
    message = layout.message ?? message;
  }

  const nameById = new Map(catalog.map((c) => [c.id, c]));
  const style = answers.garden_style;
  if (style && style !== "easy_care") {
    plant_ids = filterIdsForGardenStyle(plant_ids, catalog, style, stateCode, density);
    plant_ids = topUpIdsForGardenStyle(
      plant_ids,
      catalog,
      target,
      style,
      stateCode,
      density,
    );
    if (plant_ids.length < 1) {
      const err: Record<GardenStyle, string> = {
        food_forest:
          "No fruit trees matched your zone for this food forest. Try a different region or add trees from Browse Plants.",
        kitchen_garden:
          "No kitchen-garden plants matched your zone. Try different sun or region settings, or add herbs and veggies from Browse Plants.",
        pollinator:
          "No pollinator plants matched your zone. Try a different region or add flowers from Browse Plants.",
        visual:
          "No ornamental plants matched your zone. Try a different region or add flowers from Browse Plants.",
        easy_care: "No plants matched your zone.",
      };
      throw new Error(err[style]);
    }
    if (style === "food_forest") {
      message =
        message ??
        (foodForestTreesOnly
          ? "Fruit trees placed on the canvas — browse Plants to add shrubs, herbs, and companions."
          : "Layered food forest placed on the canvas — drag plants to adjust spacing.");
    }
  }

  plant_ids = dedupeOrderedIdsByName(dedupeOrderedIds(plant_ids), (id) =>
    nameById.get(id),
  );
  if (foodForestTreesOnly) {
    plant_ids = plant_ids.slice(0, target);
  }

  return {
    garden_name,
    garden_description,
    design_philosophy,
    plant_ids,
    source,
    message,
    hardiness_zone,
    width_feet: widthFeet,
    height_feet: heightFeet,
    target_count: target,
    preferences,
    designer_state: stateCode,
  };
}
