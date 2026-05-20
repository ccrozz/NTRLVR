import type { PlantCategory } from "../../types";
import type { CanvasPlant } from "../types";

const CATEGORY_ORDER: PlantCategory[] = [
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Palm",
  "Berry",
  "Vegetable",
  "Herb",
  "Vine",
  "Ground Cover",
  "Native Shrub",
  "Edible Flower",
  "Support Species",
];

export const GARDEN_CATEGORY_ACCENT: Partial<Record<PlantCategory, string>> = {
  "Fruit Tree": "#7ec850",
  Citrus: "#e8b84a",
  "Tropical Fruit": "#f08080",
  Palm: "#5eb8d4",
  Berry: "#c49ae8",
  Vegetable: "#8ed65f",
  Herb: "#a8c686",
  Vine: "#6b9e7a",
  "Ground Cover": "#c9b99a",
  "Native Shrub": "#74a57f",
  "Edible Flower": "#e8a838",
  "Support Species": "#8b6e52",
};

export type GardenCategoryGroup = {
  category: PlantCategory;
  plants: CanvasPlant[];
};

export function groupGardenPlantsByCategory(
  plants: CanvasPlant[],
): GardenCategoryGroup[] {
  const byCat = new Map<PlantCategory, CanvasPlant[]>();
  for (const p of plants) {
    const list = byCat.get(p.category) ?? [];
    list.push(p);
    byCat.set(p.category, list);
  }

  const groups: GardenCategoryGroup[] = [];
  for (const category of CATEGORY_ORDER) {
    const list = byCat.get(category);
    if (!list?.length) continue;
    list.sort((a, b) =>
      a.common_name.localeCompare(b.common_name, undefined, {
        sensitivity: "base",
      }),
    );
    groups.push({ category, plants: list });
  }

  for (const [category, list] of byCat) {
    if (CATEGORY_ORDER.includes(category)) continue;
    list.sort((a, b) =>
      a.common_name.localeCompare(b.common_name, undefined, {
        sensitivity: "base",
      }),
    );
    groups.push({ category, plants: list });
  }

  return groups;
}
