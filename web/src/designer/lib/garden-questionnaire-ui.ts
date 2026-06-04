import type {
  GardenExperience,
  GardenHousehold,
  GardenPriority,
  GardenStyle,
  GardenSun,
  GardenTime,
  GardenUse,
  GardenWater,
  PlantingDensity,
} from "@lib/food-forest-questionnaire";

export const GARDEN_STYLE_OPTIONS: {
  id: GardenStyle;
  title: string;
  description: string;
}[] = [
  {
    id: "food_forest",
    title: "Food forest",
    description:
      "Fruit trees and shrubs with helpful plants layered underneath — the classic backyard food forest.",
  },
  {
    id: "kitchen_garden",
    title: "Kitchen garden",
    description:
      "Herbs, greens, beans, and everyday foods you can pick for cooking — great near the house.",
  },
  {
    id: "pollinator",
    title: "Pollinator garden",
    description:
      "Perennial and annual flowers, flowering herbs, and nectar plants for bees, butterflies, and birds.",
  },
  {
    id: "visual",
    title: "Visual garden",
    description:
      "Ornamental flowers, foliage, and landscape plants — beauty first, no fruit trees.",
  },
  {
    id: "easy_care",
    title: "Easy-care garden",
    description:
      "Keep it simple — fewer fussy plants, less weekly work, still rewarding harvests.",
  },
];

export const GARDEN_USE_OPTIONS: {
  id: GardenUse;
  label: string;
  hint: string;
}[] = [
  { id: "fresh_fruit", label: "Fresh fruit", hint: "Snacking & desserts from the yard" },
  { id: "daily_cooking", label: "Daily cooking", hint: "Veggies, beans, peppers for meals" },
  { id: "herbs_tea", label: "Herbs & tea", hint: "Seasoning, tea, aromatics" },
  { id: "perennial_staples", label: "Perennial staples", hint: "Banana, cassava, long-term crops" },
  {
    id: "wildlife_pollinators",
    label: "Pollinators & wildlife",
    hint: "Bees, butterflies, birds",
  },
  { id: "native_habitat", label: "Native habitat", hint: "Florida-friendly natives" },
  { id: "shade_comfort", label: "Shade & comfort", hint: "Cooler spots to hang out" },
  { id: "visual_beauty", label: "Beauty & fragrance", hint: "Looks and scent matter" },
  { id: "medicine_home", label: "Home remedies", hint: "Aloe, moringa, useful medicinals" },
];

export const GARDEN_PRIORITY_OPTIONS: {
  id: GardenPriority;
  label: string;
  hint: string;
}[] = [
  { id: "tropical_fruit", label: "Tropical fruit", hint: "Mango, papaya, banana…" },
  { id: "citrus", label: "Citrus", hint: "Limes, oranges, calamondin…" },
  { id: "berries", label: "Berries", hint: "Blueberry, mulberry…" },
  { id: "salad_greens", label: "Salad & greens", hint: "Lettuce, kale, chard…" },
  { id: "root_crops", label: "Roots & tubers", hint: "Sweet potato, taro…" },
  { id: "nitrogen_fixers", label: "Nitrogen fixers", hint: "Beans, peas, pigeon pea…" },
  { id: "pest_support", label: "Pest support", hint: "Marigold, companions…" },
  { id: "fast_harvest", label: "Quick harvest", hint: "Fast first picks" },
  { id: "florida_natives", label: "Florida natives", hint: "Local species" },
  { id: "groundcover_mulch", label: "Living mulch", hint: "Groundcovers & fillers" },
];

export const GARDEN_TIME_OPTIONS: { id: GardenTime; label: string }[] = [
  { id: "under_1hr_week", label: "Under ~1 hr/week" },
  { id: "few_hours_week", label: "A few hours/week" },
  { id: "hobby_level", label: "Hobby-level time" },
];

export const GARDEN_EXPERIENCE_OPTIONS: { id: GardenExperience; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "some_experience", label: "Some experience" },
  { id: "experienced", label: "Experienced grower" },
];

export const GARDEN_SUN_OPTIONS: { id: GardenSun; label: string }[] = [
  { id: "full_sun", label: "Mostly full sun (6+ hrs)" },
  { id: "part_shade", label: "Part shade" },
  { id: "mixed", label: "Mixed sun & shade" },
];

export const GARDEN_WATER_OPTIONS: { id: GardenWater; label: string }[] = [
  { id: "rain_only", label: "Mostly rain only" },
  { id: "occasional", label: "Occasional watering" },
  { id: "regular_irrigation", label: "Regular irrigation" },
];

export const GARDEN_HOUSEHOLD_OPTIONS: { id: GardenHousehold; label: string }[] = [
  { id: "just_me", label: "Just me" },
  { id: "two_people", label: "2 people" },
  { id: "family", label: "Family" },
  { id: "community", label: "Sharing with neighbors" },
];

export const PLANTING_DENSITY_OPTIONS: {
  id: PlantingDensity;
  title: string;
  description: string;
}[] = [
  {
    id: "spacious",
    title: "Roomy & open",
    description:
      "Fewer plants with breathing room — easier to walk between rows and see each one.",
  },
  {
    id: "balanced",
    title: "Balanced",
    description:
      "A natural starter mix — not empty, not crowded. Most people start here.",
  },
  {
    id: "dense",
    title: "Lush & layered",
    description:
      "Dense food-forest style — many plants, tight guild spacing. Thin or drag extras later if needed.",
  },
];

/** Plain-language climate regions (maps to USDA zones under the hood). */
export const CLIMATE_REGION_OPTIONS = [
  {
    value: "8b",
    label: "North Florida",
    hint: "Cooler winters (roughly Jacksonville / Panhandle)",
  },
  {
    value: "9b",
    label: "Central Florida",
    hint: "Orlando, Tampa, most of the peninsula",
  },
  {
    value: "10a",
    label: "South Florida",
    hint: "Miami, Fort Lauderdale, warmer coast",
  },
  {
    value: "11a",
    label: "Keys & warmest spots",
    hint: "Very mild winters",
  },
] as const;
