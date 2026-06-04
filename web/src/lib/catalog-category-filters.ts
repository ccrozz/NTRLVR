/** Same groups as the designer Browse Plants sidebar (except natives — use Quick picks). */
export type CatalogGroupFilter =
  | "fruit_trees"
  | "fruits_vegetables"
  | "herbs"
  | "flowers"
  | "support";

export const CATALOG_GROUP_FILTERS: {
  key: CatalogGroupFilter;
  label: string;
}[] = [
  { key: "fruit_trees", label: "Fruit trees" },
  { key: "fruits_vegetables", label: "Fruits & veggies" },
  { key: "herbs", label: "Herbs" },
  { key: "flowers", label: "Flowers" },
  { key: "support", label: "Support" },
];

export function catalogGroupFiltersForState(_stateCode: string) {
  return CATALOG_GROUP_FILTERS;
}
