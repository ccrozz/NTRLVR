/** Shared garden questionnaire for auto-fill (server + web). */

/** Plain-language garden type (shown in the auto-fill wizard). */
export type GardenStyle =
  | "food_forest"
  | "kitchen_garden"
  | "pollinator"
  | "visual"
  | "easy_care";

export const GARDEN_STYLE_LABELS: Record<GardenStyle, string> = {
  food_forest: "Food forest",
  kitchen_garden: "Kitchen garden",
  pollinator: "Pollinator garden",
  visual: "Visual garden",
  easy_care: "Easy-care garden",
};

export type FoodForestLayoutGoal =
  | "balanced"
  | "fruit_trees"
  | "herbs_produce"
  | "pollinators"
  | "natives"
  | "low_maintenance";

export type GardenUse =
  | "fresh_fruit"
  | "daily_cooking"
  | "herbs_tea"
  | "perennial_staples"
  | "wildlife_pollinators"
  | "native_habitat"
  | "shade_comfort"
  | "visual_beauty"
  | "medicine_home";

export type GardenTime =
  | "under_1hr_week"
  | "few_hours_week"
  | "hobby_level";

export type GardenExperience =
  | "beginner"
  | "some_experience"
  | "experienced";

export type GardenSun = "full_sun" | "part_shade" | "mixed";

export type GardenWater =
  | "rain_only"
  | "occasional"
  | "regular_irrigation";

export type GardenPriority =
  | "tropical_fruit"
  | "citrus"
  | "berries"
  | "salad_greens"
  | "root_crops"
  | "nitrogen_fixers"
  | "pest_support"
  | "fast_harvest"
  | "florida_natives"
  | "groundcover_mulch";

export type GardenHousehold =
  | "just_me"
  | "two_people"
  | "family"
  | "community";

/** How many plants to pack into the starter layout. */
export type PlantingDensity = "spacious" | "balanced" | "dense";

export const PLANTING_DENSITY_LABELS: Record<PlantingDensity, string> = {
  spacious: "roomy spacing",
  balanced: "balanced density",
  dense: "dense planting",
};

export type GardenPreferences = {
  gardenStyle?: GardenStyle;
  density?: PlantingDensity;
  uses: GardenUse[];
  time: GardenTime;
  experience: GardenExperience;
  sun: GardenSun;
  water: GardenWater;
  priorities: GardenPriority[];
  household: GardenHousehold;
  notes?: string;
};

export const DEFAULT_GARDEN_PREFERENCES: GardenPreferences = {
  uses: ["fresh_fruit", "daily_cooking"],
  density: "balanced",
  time: "few_hours_week",
  experience: "some_experience",
  sun: "full_sun",
  water: "occasional",
  priorities: ["tropical_fruit", "nitrogen_fixers"],
  household: "family",
  notes: "",
};

export function defaultDensityForGardenStyle(
  style: GardenStyle,
): PlantingDensity {
  switch (style) {
    case "easy_care":
    case "visual":
      return "spacious";
    case "food_forest":
    case "kitchen_garden":
    case "pollinator":
      return "dense";
    default:
      return "balanced";
  }
}

/** Map a simple garden pick to full preferences for AI + layout. */
export type WizardPreferenceInput = {
  gardenStyle: GardenStyle;
  uses: GardenUse[];
  priorities: GardenPriority[];
  time: GardenTime;
  experience: GardenExperience;
  sun: GardenSun;
  water: GardenWater;
  household: GardenHousehold;
  density: PlantingDensity;
  notes?: string;
};

/** Merge wizard answers with style defaults for AI + heuristic layout. */
export function buildWizardPreferences(
  input: WizardPreferenceInput,
): GardenPreferences {
  const styleDefaults = preferencesFromGardenStyle(input.gardenStyle);
  return normalizePreferences({
    ...styleDefaults,
    gardenStyle: input.gardenStyle,
    uses: input.uses.length ? input.uses : styleDefaults.uses,
    priorities: input.priorities.length
      ? input.priorities.slice(0, 3)
      : styleDefaults.priorities,
    time: input.time,
    experience: input.experience,
    sun: input.sun,
    water: input.water,
    household: input.household,
    density: input.density,
    notes: input.notes?.trim() ?? "",
  });
}

export function preferencesFromGardenStyle(style: GardenStyle): GardenPreferences {
  const base: GardenPreferences = {
    ...DEFAULT_GARDEN_PREFERENCES,
    gardenStyle: style,
  };

  switch (style) {
    case "food_forest":
      return {
        ...base,
        uses: ["fresh_fruit", "perennial_staples", "wildlife_pollinators"],
        priorities: ["tropical_fruit", "nitrogen_fixers", "groundcover_mulch"],
        time: "few_hours_week",
        experience: "some_experience",
        household: "family",
      };
    case "kitchen_garden":
      return {
        ...base,
        uses: ["daily_cooking", "herbs_tea"],
        priorities: ["salad_greens", "root_crops", "fast_harvest"],
        time: "few_hours_week",
        experience: "beginner",
        household: "family",
      };
    case "pollinator":
      return {
        ...base,
        uses: ["wildlife_pollinators", "visual_beauty", "native_habitat"],
        priorities: ["pest_support", "florida_natives", "groundcover_mulch"],
        time: "few_hours_week",
        experience: "some_experience",
        household: "just_me",
      };
    case "visual":
      return {
        ...base,
        uses: ["visual_beauty", "shade_comfort"],
        priorities: ["florida_natives", "fast_harvest"],
        time: "few_hours_week",
        experience: "beginner",
        household: "just_me",
      };
    case "easy_care":
      return {
        ...base,
        uses: ["perennial_staples", "fresh_fruit"],
        priorities: ["groundcover_mulch", "fast_harvest"],
        time: "under_1hr_week",
        experience: "beginner",
        water: "rain_only",
        household: "just_me",
      };
    default:
      return base;
  }
}

export function normalizePreferences(
  raw: Partial<GardenPreferences> | undefined,
): GardenPreferences {
  const p = { ...DEFAULT_GARDEN_PREFERENCES, ...raw };
  const density =
    p.density === "spacious" ||
    p.density === "balanced" ||
    p.density === "dense"
      ? p.density
      : DEFAULT_GARDEN_PREFERENCES.density;

  return {
    gardenStyle: p.gardenStyle,
    density,
    uses: Array.isArray(p.uses) && p.uses.length ? p.uses : DEFAULT_GARDEN_PREFERENCES.uses,
    time: p.time ?? DEFAULT_GARDEN_PREFERENCES.time,
    experience: p.experience ?? DEFAULT_GARDEN_PREFERENCES.experience,
    sun: p.sun ?? DEFAULT_GARDEN_PREFERENCES.sun,
    water: p.water ?? DEFAULT_GARDEN_PREFERENCES.water,
    priorities: (p.priorities ?? []).slice(0, 3),
    household: p.household ?? DEFAULT_GARDEN_PREFERENCES.household,
    notes: p.notes?.trim() ?? "",
  };
}

/** Maps rich answers to legacy goal tags for ratios & filters. */
export function deriveGoalsFromPreferences(
  prefs: GardenPreferences,
): FoodForestLayoutGoal[] {
  switch (prefs.gardenStyle) {
    case "food_forest":
      return ["fruit_trees"];
    case "kitchen_garden":
      return prefs.time === "under_1hr_week" || prefs.experience === "beginner"
        ? ["herbs_produce", "low_maintenance"]
        : ["herbs_produce"];
    case "pollinator":
      return ["pollinators", "natives"];
    case "visual":
      return ["pollinators"];
    default:
      break;
  }

  const goals = new Set<FoodForestLayoutGoal>();

  if (prefs.time === "under_1hr_week" || prefs.experience === "beginner") {
    goals.add("low_maintenance");
  }

  if (
    prefs.uses.includes("fresh_fruit") ||
    prefs.priorities.includes("tropical_fruit") ||
    prefs.priorities.includes("citrus") ||
    prefs.priorities.includes("berries")
  ) {
    goals.add("fruit_trees");
  }

  if (
    prefs.uses.includes("daily_cooking") ||
    prefs.uses.includes("herbs_tea") ||
    prefs.priorities.includes("salad_greens") ||
    prefs.priorities.includes("root_crops")
  ) {
    goals.add("herbs_produce");
  }

  if (
    prefs.uses.includes("wildlife_pollinators") ||
    prefs.priorities.includes("pest_support") ||
    prefs.priorities.includes("nitrogen_fixers")
  ) {
    goals.add("pollinators");
  }

  if (
    prefs.uses.includes("native_habitat") ||
    prefs.priorities.includes("florida_natives")
  ) {
    goals.add("natives");
  }

  if (goals.size === 0) goals.add("balanced");
  if (goals.size > 1) goals.delete("balanced");

  return [...goals];
}

/** Food forests at roomy density place fruit trees only; balanced/dense fill the full guild. */
export function foodForestCanvasTreesOnly(
  density: PlantingDensity = "balanced",
): boolean {
  return density === "spacious";
}

/** Target plant count for Build For Me / auto-fill (respects style + density). */
export function resolveGardenPlantTarget(
  areaSqFt: number,
  prefs: GardenPreferences,
  gardenStyle?: GardenStyle,
): number {
  const density = prefs.density ?? "balanced";
  if (
    gardenStyle === "food_forest" &&
    foodForestCanvasTreesOnly(density)
  ) {
    return targetFoodForestTreeCount(areaSqFt, density);
  }
  return Math.min(
    maxPlantsForCanvas(areaSqFt, density),
    targetPlantCountFromPreferences(areaSqFt, prefs),
  );
}

/** Plants that fit on the 2D canvas; dense allows more (smaller layout footprints). */
export function maxPlantsForCanvas(
  areaSqFt: number,
  density: PlantingDensity = "balanced",
): number {
  let base: number;
  if (areaSqFt <= 100) base = 12;
  else if (areaSqFt < 225) base = 15;
  else if (areaSqFt < 400) base = 18;
  else if (areaSqFt < 650) base = 22;
  else base = Math.min(32, Math.floor(areaSqFt / 24));

  switch (density) {
    case "dense":
      return Math.min(
        55,
        Math.max(16, Math.floor(areaSqFt / 11) + 4, Math.round(base * 1.9)),
      );
    case "spacious":
      return Math.max(5, Math.round(base * 0.65));
    default:
      return base;
  }
}

export function targetPlantCountFromPreferences(
  areaSqFt: number,
  prefs: GardenPreferences,
): number {
  const goals = deriveGoalsFromPreferences(prefs);
  const low =
    goals.includes("low_maintenance") || prefs.time === "under_1hr_week";
  const density = prefs.density ?? "balanced";
  const cap = maxPlantsForCanvas(areaSqFt, density);
  let base = cap;
  if (low && density !== "dense") base = Math.floor(base * 0.75);
  if (prefs.household === "family" || prefs.household === "community") {
    base = Math.min(base + 2, cap);
  }
  if (prefs.time === "hobby_level") {
    base = Math.min(base + 3, cap);
  }
  const minCount =
    density === "spacious"
      ? low
        ? 5
        : 7
      : density === "dense"
        ? Math.max(14, Math.floor(cap * 0.85))
        : low
          ? 8
          : Math.min(cap, Math.max(10, Math.floor(cap * 0.85)));
  return Math.max(minCount, Math.min(cap, base));
}

/** How many fruit trees to place on the canvas for a food-forest Build For Me plan. */
export function targetFoodForestTreeCount(
  areaSqFt: number,
  density: PlantingDensity = "balanced",
): number {
  let base: number;
  if (areaSqFt < 80) base = 2;
  else if (areaSqFt < 150) base = 3;
  else if (areaSqFt < 300) base = 4;
  else if (areaSqFt < 500) base = 5;
  else base = 6;

  switch (density) {
    case "dense":
      return Math.min(8, base + 2);
    case "spacious":
      return Math.max(2, base - 1);
    default:
      return base;
  }
}

const USE_LABELS: Record<GardenUse, string> = {
  fresh_fruit: "fresh fruit & snacking",
  daily_cooking: "daily cooking",
  herbs_tea: "herbs, tea & seasoning",
  perennial_staples: "perennial staples",
  wildlife_pollinators: "wildlife & pollinators",
  native_habitat: "native habitat",
  shade_comfort: "shade & comfort",
  visual_beauty: "beauty & fragrance",
  medicine_home: "home remedies",
};

const TIME_LABELS: Record<GardenTime, string> = {
  under_1hr_week: "under ~1 hour/week",
  few_hours_week: "a few hours/week",
  hobby_level: "hobby-level time",
};

const SUN_LABELS: Record<GardenSun, string> = {
  full_sun: "mostly full sun (6+ hrs)",
  part_shade: "part shade",
  mixed: "mixed sun & shade",
};

const WATER_LABELS: Record<GardenWater, string> = {
  rain_only: "mostly rain only",
  occasional: "occasional watering",
  regular_irrigation: "regular irrigation",
};

const EXP_LABELS: Record<GardenExperience, string> = {
  beginner: "beginner",
  some_experience: "some experience",
  experienced: "experienced grower",
};

const PRIORITY_LABELS: Record<GardenPriority, string> = {
  tropical_fruit: "tropical fruit",
  citrus: "citrus",
  berries: "berries",
  salad_greens: "salad & greens",
  root_crops: "roots & tubers",
  nitrogen_fixers: "nitrogen fixers",
  pest_support: "pest support plants",
  fast_harvest: "fast first harvest",
  florida_natives: "Florida natives",
  groundcover_mulch: "living mulch / groundcover",
};

const HOUSE_LABELS: Record<GardenHousehold, string> = {
  just_me: "just me",
  two_people: "2 people",
  family: "family",
  community: "sharing with neighbors",
};

const STYLE_PROFILE: Record<GardenStyle, string> = {
  food_forest:
    "A food forest canopy: fruit trees only on the canvas first — shrubs and herbs come later from Browse Plants.",
  kitchen_garden:
    "A kitchen garden: herbs, vegetables, tomatoes, peppers, beans, and greens for everyday cooking — no fruit trees.",
  pollinator:
    "A pollinator garden: perennial and annual flowers, flowering herbs, and nectar plants for bees and butterflies — no fruit trees.",
  visual:
    "A visual garden: the prettiest ornamental flowers, foliage, and landscape plants — no fruit trees.",
  easy_care:
    "A low-maintenance garden: tough, easy plants and not too much to manage.",
};

export function buildGardenerProfileText(prefs: GardenPreferences): string {
  const styleLine = prefs.gardenStyle
    ? `Garden type: ${GARDEN_STYLE_LABELS[prefs.gardenStyle]}. ${STYLE_PROFILE[prefs.gardenStyle]}`
    : "";
  const uses = prefs.uses.map((u) => USE_LABELS[u]).join("; ");
  const priorities = prefs.priorities
    .map((p) => PRIORITY_LABELS[p])
    .join("; ");
  const lines = [
    styleLine,
    `They want: ${uses}.`,
    `Care level: ${TIME_LABELS[prefs.time]}, ${EXP_LABELS[prefs.experience]}.`,
    `Sun: ${SUN_LABELS[prefs.sun]}. Water: ${WATER_LABELS[prefs.water]}.`,
    `Planting density: ${PLANTING_DENSITY_LABELS[prefs.density ?? "balanced"]}.`,
    `Household: ${HOUSE_LABELS[prefs.household]}.`,
    priorities ? `Emphasize: ${priorities}.` : "",
    prefs.notes ? `Notes: ${prefs.notes}` : "",
  ].filter(Boolean);
  return lines.join(" ");
}

type ScoreRow = {
  common_name: string;
  canopy_layer: string;
  category: string;
  radius_ft: number;
  native: boolean;
  edible: boolean;
};

export function scoreCatalogRow(
  row: ScoreRow,
  prefs: GardenPreferences,
): number {
  let score = 0;
  const name = row.common_name.toLowerCase();
  const cat = row.category.toLowerCase();
  const layer = row.canopy_layer;

  if (row.edible) score += 2;
  if (prefs.priorities.includes("florida_natives") || prefs.uses.includes("native_habitat")) {
    if (row.native) score += 10;
    else score -= 3;
  }

  if (prefs.priorities.includes("tropical_fruit") || prefs.uses.includes("fresh_fruit")) {
    if (cat.includes("tropical") || name.includes("mango") || name.includes("papaya"))
      score += 6;
  }
  if (prefs.priorities.includes("citrus") || name.includes("citrus") || cat === "citrus") {
    score += 6;
  }
  if (prefs.priorities.includes("berries") || cat === "berry") score += 5;

  if (prefs.priorities.includes("salad_greens") || prefs.uses.includes("daily_cooking")) {
    if (layer === "Herbaceous" || cat === "vegetable" || cat === "herb") score += 5;
    if (
      name.includes("bean") ||
      name.includes("pea") ||
      name.includes("tomato") ||
      name.includes("pepper") ||
      name.includes("squash")
    ) {
      score += 3;
    }
  }
  if (
    prefs.gardenStyle === "kitchen_garden" &&
    (cat === "vegetable" || cat === "herb")
  ) {
    score += 2;
  }
  if (prefs.priorities.includes("root_crops")) {
    if (
      name.includes("sweet potato") ||
      name.includes("turmeric") ||
      name.includes("ginger")
    )
      score += 6;
  }
  if (prefs.priorities.includes("nitrogen_fixers")) {
    if (
      name.includes("pigeon") ||
      name.includes("comfrey") ||
      cat.includes("support")
    )
      score += 7;
  }
  if (prefs.priorities.includes("pest_support") || prefs.uses.includes("wildlife_pollinators")) {
    if (cat.includes("support") || cat.includes("flower")) score += 4;
  }
  if (
    prefs.gardenStyle === "pollinator" ||
    prefs.uses.includes("wildlife_pollinators") ||
    prefs.uses.includes("visual_beauty")
  ) {
    if (cat.includes("flower") || cat === "edible flower") score += 5;
  }
  if (prefs.priorities.includes("fast_harvest")) {
    if (layer === "Herbaceous" || row.radius_ft <= 3) score += 4;
  }
  if (prefs.priorities.includes("groundcover_mulch")) {
    if (layer === "Groundcover") score += 6;
  }
  if (prefs.uses.includes("herbs_tea") && cat === "herb") score += 5;
  if (prefs.uses.includes("medicine_home")) {
    if (name.includes("aloe") || name.includes("lemongrass") || name.includes("moringa"))
      score += 4;
  }
  if (prefs.uses.includes("shade_comfort") && (layer === "Overstory" || layer === "Understory")) {
    score += 3;
  }

  if (prefs.time === "under_1hr_week" || prefs.experience === "beginner") {
    if (row.radius_ft > 8) score -= 4;
    if (row.radius_ft <= 3) score += 2;
  }
  if (prefs.water === "rain_only" && row.radius_ft > 6) score -= 2;
  if (prefs.sun === "part_shade" && layer === "Herbaceous") score += 2;

  if (prefs.household === "family" || prefs.household === "community") {
    if (row.edible && row.radius_ft <= 4) score += 2;
  }

  const isTreeCat =
    cat.includes("fruit tree") ||
    cat === "citrus" ||
    cat.includes("tropical fruit") ||
    cat === "palm";
  if (prefs.gardenStyle === "kitchen_garden") {
    if (cat === "herb" || cat === "vegetable") score += 8;
    if (isTreeCat || layer === "Overstory") score -= 20;
  }
  if (prefs.gardenStyle === "pollinator") {
    if (cat.includes("flower") || cat === "edible flower") score += 8;
    if (cat === "vegetable" || isTreeCat) score -= 12;
  }
  if (prefs.gardenStyle === "visual") {
    if (cat.includes("flower") || cat === "native shrub") score += 8;
    if (isTreeCat || cat === "vegetable") score -= 20;
    if (prefs.uses.includes("visual_beauty") && !row.edible) score += 4;
  }

  return score;
}
