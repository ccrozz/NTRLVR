import type { Plant, PlantCategory } from "../schema.js";

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
  natives: { label: "Florida natives", short: "Natives" },
};

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
): boolean {
  switch (group) {
    case "fruit_trees":
      return FRUIT_TREE_CATEGORIES.includes(plant.category);
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
        (plant.category === "Native Shrub" && hasTag(plant, "pollinator"))
      );
    case "support":
      return (
        plant.category === "Support Species" ||
        hasTag(plant, "support") ||
        hasGuild(plant, "Nitrogen Fixer") ||
        hasGuild(plant, "Dynamic Accumulator")
      );
    case "natives":
      return plant.is_florida_native;
    default:
      return true;
  }
}

export function isFoodForestGroup(value: string): value is FoodForestGroup {
  return value in FOOD_FOREST_GROUP_LABELS;
}
