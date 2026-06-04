import type { Plant, PlantCategory } from "../schema.js";
import { plantIsNativeToState } from "./plant-native-status.js";
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
  return plantIsNativeToState(plant, stateCode);
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

/** Minimal fields to test the designer “Fruit trees” group (Build For Me canvas picks). */
export type FruitTreeMatchInput = {
  category: PlantCategory;
  tags?: string[];
  is_edible?: boolean;
  is_kitchen_essential?: boolean;
  is_florida_native?: boolean;
  native_states?: string[];
};

export function matchesFruitTreesGroup(
  plant: FruitTreeMatchInput,
  stateCode: DesignerStateCode | string = "FL",
): boolean {
  const tags = plant.tags ?? [];
  const hasTagLoose = (tag: string) =>
    tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  if (!FRUIT_TREE_CATEGORIES.includes(plant.category)) return false;
  if (hasTagLoose("landscape")) return false;
  if (
    plant.category === "Palm" &&
    !plant.is_edible &&
    !plant.is_kitchen_essential
  ) {
    return false;
  }
  const nativeStates = plant.native_states ?? [];
  const isNative =
    nativeStates.some((s) => s.toUpperCase() === stateCode.toUpperCase()) ||
    (stateCode.toUpperCase() === "FL" &&
      Boolean(plant.is_florida_native) &&
      nativeStates.length === 0);
  if (!plant.is_edible && isNative) return false;
  return true;
}

/** Catalog / layout row with category + edible (+ optional native). */
export function catalogRowIsFoodForestTree(
  row: { category: string; edible?: boolean; native?: boolean },
  stateCode: DesignerStateCode | string = "FL",
): boolean {
  return matchesFruitTreesGroup(
    {
      category: row.category as PlantCategory,
      tags: [],
      is_edible: row.edible ?? false,
      is_kitchen_essential: false,
      is_florida_native: row.native ?? false,
      native_states: row.native ? [String(stateCode)] : [],
    },
    stateCode,
  );
}

export function plantMatchesFoodForestGroup(
  plant: Plant,
  group: FoodForestGroup,
  stateCode: DesignerStateCode | string = "FL",
): boolean {
  switch (group) {
    case "fruit_trees":
      return matchesFruitTreesGroup(
        {
          category: plant.category,
          tags: plant.tags,
          is_edible: plant.is_edible,
          is_kitchen_essential: plant.is_kitchen_essential,
          is_florida_native: plant.is_florida_native,
          native_states: plant.native_states,
        },
        stateCode,
      );
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
