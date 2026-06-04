import type { GardenStyle } from "@lib/food-forest-questionnaire";
import type { GardenGenerateResult } from "@lib/garden-generate";
import type { PlantListItem } from "../types";
import { dedupeOrderedIdsByName } from "@lib/plant-dedupe";
import type { GardenProfile, RecommendedPlantMeta } from "../types/garden-plan";

export function priorityBadge(n: number): string {
  return String(n);
}

function whyForPlant(
  plant: PlantListItem,
  priority: number,
  style: GardenStyle | undefined,
): string {
  if (priority === 1) {
    if (style === "kitchen_garden") return "Core crop for your kitchen garden";
    if (style === "pollinator") return "Pollinator magnet — plant early";
    if (style === "visual") return "Showpiece — sets the look of the bed";
    if (style === "food_forest") return "Canopy anchor — fruit tree for your food forest";
    return "Anchor for your guild structure";
  }
  const layer = plant.canopy_layer;
  if (layer === "Overstory" || layer === "Understory") {
    return "Canopy layer — establishes long-term structure";
  }
  if (layer === "Shrub") return "Mid-layer fill — fruit, flowers, or support";
  if (plant.is_florida_native) return "Florida-friendly native for your site";
  if (plant.is_edible) return "Edible pick matched to your goals";
  if (layer === "Groundcover") return "Living mulch and soil protection";
  return "Supports diversity and resilience in the bed";
}

function placementNote(
  plant: PlantListItem,
  style: GardenStyle | undefined,
): string {
  if (style === "food_forest") {
    return "Placed as a canopy tree — drag shrubs and herbs from Browse Plants underneath.";
  }
  if (style === "kitchen_garden") {
    return "Kitchen-bed placement — keep harvest paths clear and sun on your crops.";
  }
  if (style === "pollinator") {
    return "Group with other nectar plants so pollinators find the bed quickly.";
  }
  if (style === "visual") {
    return "Place where it reads from the patio or window — color and height matter.";
  }
  switch (plant.canopy_layer) {
    case "Overstory":
      return "Place toward the north or west edge so shade falls where you want it.";
    case "Understory":
      return "Tuck under or beside canopy trees with room to spread.";
    case "Shrub":
      return "Mid-bed placement with ~3–6 ft spacing depending on mature size.";
    case "Vine":
      return "Near a trellis, fence, or shrub it can climb.";
    case "Groundcover":
      return "Edge paths or open ground between larger plants.";
    case "Root":
      return "Loose, deep soil — avoid compacted foot traffic.";
    default:
      return "Sun-facing row or guild edge with easy access for harvest.";
  }
}

export function buildGardenProfile(result: GardenGenerateResult): GardenProfile {
  const style = result.preferences.gardenStyle;
  const beginner = result.preferences.experience === "beginner";

  const planting_sequence = [
    "Mark beds and paths, then plant support species (nitrogen fixers, mulch plants).",
    "Set canopy and large shrubs — they define shade and spacing.",
    "Fill mid-layer shrubs and herbs while soil is still easy to work.",
    "Finish with groundcovers, vines on trellises, and quick annual gaps.",
  ];

  const first_year_focus = beginner
    ? "Focus on establishment: mulch, water through dry weeks, and resist packing in too much at once."
    : "Year one is about structure and soil — harvest lightly while roots establish.";

  const avoid_mistakes = [
    "Planting too close — Florida humidity needs airflow between plants.",
    "Skipping mulch in the first summer dry spell.",
    style === "kitchen_garden"
      ? "Letting greens bolt before you harvest — replant in short successions."
      : "Placing sun-lovers under mature shade without a plan to prune.",
  ];

  return {
    name: result.garden_name,
    description: result.garden_description,
    philosophy: result.design_philosophy,
    planting_sequence,
    first_year_focus,
    avoid_mistakes,
  };
}

export function buildRecommendationMeta(
  result: GardenGenerateResult,
  plantsById: Map<string, PlantListItem>,
): RecommendedPlantMeta[] {
  const style = result.preferences.gardenStyle;
  const ids = dedupeOrderedIdsByName(result.plant_ids, (id) =>
    plantsById.get(id),
  );
  return ids
    .map((id, i) => {
      const plant = plantsById.get(id);
      if (!plant) return null;
      const priority = i + 1;
      return {
        plant_id: id,
        priority,
        why: whyForPlant(plant, priority, style),
        placement_note: placementNote(plant, style),
      };
    })
    .filter((x): x is RecommendedPlantMeta => x != null);
}
