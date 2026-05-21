import type { Plant, PlantCategory } from "../schema.js";
import type { DesignerStateCode } from "./designer-states.js";
import { designerStateConfig } from "./designer-states.js";

/** Designer sidebar group filters for Florida food-forest plants. */
export type FoodForestGroup =
  | "fruit_trees"
  | "fruits_vegetables"
  | "vines"
  | "herbs"
  | "flowers"
  | "support"
  | "natives";

export const FOOD_FOREST_GROUP_LABELS: Record<
  FoodForestGroup,
  { label: string; short: string }
> = {
  fruit_trees: { label: "Fruit trees", short: "Trees" },
  fruits_vegetables: { label: "Fruits & vegetables", short: "Produce" },
  vines: { label: "Vines", short: "Vines" },
  herbs: { label: "Herbs", short: "Herbs" },
  flowers: { label: "Flowers & pollinators", short: "Flowers" },
  support: { label: "Support plants", short: "Support" },
  natives: { label: "Natives", short: "Natives" },
};

export function nativesGroupLabel(stateCode?: string): string {
  const name = designerStateConfig(stateCode ?? "FL")?.name ?? "Local";
  return `${name} natives`;
}

export function plantIsNativeForDesignerState(
  plant: Plant,
  stateCode: string,
): boolean {
  const st = stateCode.toUpperCase();
  if (plant.native_states.some((s) => s.toUpperCase() === st)) return true;
  if (
    st === "FL" &&
    plant.is_florida_native &&
    plant.native_states.length === 0
  ) {
    return true;
  }
  return false;
}

const FRUIT_TREE_CATEGORIES: PlantCategory[] = [
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Palm",
];

const PRODUCE_CATEGORIES: PlantCategory[] = [
  "Berry",
  "Vegetable",
  "Ground Cover",
];

function hasTag(plant: Plant, tag: string): boolean {
  return plant.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}

function hasGuild(plant: Plant, fn: string): boolean {
  return plant.guild_functions.some(
    (g) => g.toLowerCase() === fn.toLowerCase(),
  );
}

export function plantMatchesFoodForestGroup(
  plant: Plant,
  group: FoodForestGroup,
  stateCode: DesignerStateCode | string = "FL",
): boolean {
  switch (group) {
    case "fruit_trees":
      if (!FRUIT_TREE_CATEGORIES.includes(plant.category)) return false;
      if (hasTag(plant, "landscape")) return false;
      // Trefle maps any Arecaceae (e.g. Bactris) as Palm — only food palms here
      if (
        plant.category === "Palm" &&
        !plant.is_edible &&
        !plant.is_kitchen_essential
      ) {
        return false;
      }
      // Native timber/ornamental trees mis-tagged as fruit (legacy FL imports)
      if (
        !plant.is_edible &&
        plantIsNativeForDesignerState(plant, stateCode)
      ) {
        return false;
      }
      return true;
    case "fruits_vegetables":
      return PRODUCE_CATEGORIES.includes(plant.category);
    case "vines":
      return plant.category === "Vine";
    case "herbs":
      return plant.category === "Herb";
    case "flowers":
      return (
        plant.category === "Edible Flower" ||
        hasTag(plant, "pollinator") ||
        (plant.category === "Native Shrub" && hasTag(plant, "pollinator")) ||
        hasTag(plant, "landscape")
      );
    case "support":
      return (
        plant.category === "Support Species" ||
        hasTag(plant, "support") ||
        hasGuild(plant, "Nitrogen Fixer") ||
        hasGuild(plant, "Dynamic Accumulator")
      );
    case "natives":
      return plantIsNativeForDesignerState(plant, stateCode);
    default:
      return true;
  }
}

export function isFoodForestGroup(value: string): value is FoodForestGroup {
  return value in FOOD_FOREST_GROUP_LABELS;
}
