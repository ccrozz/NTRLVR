/**
 * Conversational garden onboarding — shared types and mapping to layout engine.
 */
import type { FloridaRegionId } from "./florida-onboarding-regions.js";
import {
  floridaRegionById,
  hardinessZoneForFloridaRegion,
} from "./florida-onboarding-regions.js";
import type {
  FoodForestLayoutGoal,
  GardenExperience,
  GardenHousehold,
  GardenPreferences,
  GardenPriority,
  GardenStyle,
  GardenSun,
  GardenTime,
  GardenUse,
  GardenWater,
  PlantingDensity,
} from "./food-forest-questionnaire.js";
import {
  buildWizardPreferences,
  defaultDensityForGardenStyle,
  deriveGoalsFromPreferences,
  GARDEN_STYLE_LABELS,
  preferencesFromGardenStyle,
} from "./food-forest-questionnaire.js";

export type PropertyType = "yard" | "container" | "land" | "community";
export type SpaceSize = "tiny" | "small" | "medium" | "large";
export type OnboardingGoal =
  | "food_production"
  | "wildlife"
  | "medicinal"
  | "savings"
  | "regenerative"
  | "aesthetic"
  | "pollinator"
  | "low_maintenance";
export type OnboardingSunlight = "full" | "partial" | "dappled" | "shade";
export type MaintenanceLevel = "minimal" | "moderate" | "intensive";
export type OnboardingWater = "rain_only" | "hand_water" | "irrigated";
export type OnboardingExperience = "beginner" | "intermediate" | "advanced";
export type OnboardingSpaceSource = "preset" | "canvas_zone" | "custom_feet";

export type GardenOnboardingAnswers = {
  garden_style: GardenStyle;
  property_type: PropertyType;
  space_size: SpaceSize;
  goals: OnboardingGoal[];
  sunlight: OnboardingSunlight;
  maintenance: MaintenanceLevel;
  water: OnboardingWater;
  preferences: string[];
  experience: OnboardingExperience;
  /** Where in Florida — drives USDA zone for plant picks. */
  florida_region?: FloridaRegionId;
  hardiness_zone?: string;
  /** How bed size was chosen (preset buckets, drawn canvas zone, or custom feet). */
  space_source?: OnboardingSpaceSource;
  /** Actual bed size in feet — overrides preset when set. */
  bed_width_feet?: number;
  bed_height_feet?: number;
  /** Client reference to a workspace zone (ignored by layout API). */
  canvas_zone_id?: string;
  /** How tightly to pack plants on the layout (user choice overrides inference). */
  planting_density?: PlantingDensity;
};

export const ONBOARDING_GOAL_LABELS: Record<
  OnboardingGoal,
  { title: string; subtitle: string }
> = {
  food_production: {
    title: "Feed my family",
    subtitle: "Grow food I can actually eat every week",
  },
  wildlife: {
    title: "Support local wildlife",
    subtitle: "Attract birds, bees, and butterflies",
  },
  medicinal: {
    title: "Grow medicine and herbs",
    subtitle: "Plants for health, teas, and remedies",
  },
  savings: {
    title: "Reduce grocery bills",
    subtitle: "High-yield edibles that replace store trips",
  },
  regenerative: {
    title: "Improve my soil and environment",
    subtitle: "Regenerate the land, fix nitrogen, build ecosystem",
  },
  aesthetic: {
    title: "A beautiful, peaceful space",
    subtitle: "Something that looks and feels amazing",
  },
  pollinator: {
    title: "Pollinator garden",
    subtitle: "Support bees, butterflies, and beneficial insects",
  },
  low_maintenance: {
    title: "Low effort, high reward",
    subtitle: "Plants that mostly take care of themselves",
  },
};

export const SPACE_SIZE_COMPARISONS: Record<SpaceSize, string> = {
  tiny: "About the size of a parking space",
  small: "About the size of a one-car garage",
  medium: "About the size of a tennis court",
  large: "Bigger than a tennis court",
};

export function spaceDimensions(
  size: SpaceSize,
  property: PropertyType,
): { widthFeet: number; heightFeet: number; areaSqFt: number } {
  const base: Record<SpaceSize, { w: number; h: number }> = {
    tiny: { w: 10, h: 10 },
    small: { w: 18, h: 14 },
    medium: { w: 25, h: 25 },
    large: { w: 40, h: 35 },
  };
  let { w, h } = base[size];
  if (property === "container") {
    w = Math.min(w, size === "large" ? 24 : size === "medium" ? 18 : 14);
    h = Math.min(h, size === "large" ? 20 : size === "medium" ? 14 : 10);
  }
  if (property === "land" && size === "large") {
    w = 50;
    h = 40;
  }
  return { widthFeet: w, heightFeet: h, areaSqFt: w * h };
}

/** Bed dimensions for generate + layout (canvas zone or custom feet override presets). */
export function resolveOnboardingBedDimensions(
  answers: GardenOnboardingAnswers,
): { widthFeet: number; heightFeet: number; areaSqFt: number } {
  const w = answers.bed_width_feet;
  const h = answers.bed_height_feet;
  if (
    w != null &&
    h != null &&
    Number.isFinite(w) &&
    Number.isFinite(h) &&
    w >= 6 &&
    h >= 6
  ) {
    return { widthFeet: w, heightFeet: h, areaSqFt: w * h };
  }
  return spaceDimensions(answers.space_size, answers.property_type);
}

export function spaceSizeLabel(size: SpaceSize): string {
  switch (size) {
    case "tiny":
      return "under 100 sq ft";
    case "small":
      return "100–500 sq ft";
    case "medium":
      return "500–2,000 sq ft";
    case "large":
      return "2,000+ sq ft";
  }
}

function mapSunlight(sun: OnboardingSunlight): GardenSun {
  switch (sun) {
    case "full":
      return "full_sun";
    case "partial":
    case "dappled":
      return "part_shade";
    case "shade":
      return "mixed";
  }
}

function mapWater(water: OnboardingWater): GardenWater {
  switch (water) {
    case "rain_only":
      return "rain_only";
    case "hand_water":
      return "occasional";
    case "irrigated":
      return "regular_irrigation";
  }
}

function mapExperience(exp: OnboardingExperience): GardenExperience {
  switch (exp) {
    case "beginner":
      return "beginner";
    case "intermediate":
      return "some_experience";
    case "advanced":
      return "experienced";
  }
}

function mapMaintenanceTime(m: MaintenanceLevel): GardenTime {
  switch (m) {
    case "minimal":
      return "under_1hr_week";
    case "moderate":
      return "few_hours_week";
    case "intensive":
      return "hobby_level";
  }
}

function mapGoalsToUses(goals: OnboardingGoal[]): GardenUse[] {
  const uses = new Set<GardenUse>();
  for (const g of goals) {
    switch (g) {
      case "food_production":
      case "savings":
        uses.add("daily_cooking");
        uses.add("fresh_fruit");
        break;
      case "wildlife":
      case "pollinator":
        uses.add("wildlife_pollinators");
        break;
      case "medicinal":
        uses.add("medicine_home");
        uses.add("herbs_tea");
        break;
      case "regenerative":
        uses.add("perennial_staples");
        uses.add("native_habitat");
        break;
      case "aesthetic":
        uses.add("visual_beauty");
        break;
      case "low_maintenance":
        uses.add("perennial_staples");
        break;
    }
  }
  if (uses.size === 0) {
    uses.add("fresh_fruit");
    uses.add("daily_cooking");
  }
  return [...uses];
}

function mapGoalsToPriorities(goals: OnboardingGoal[]): GardenPriority[] {
  const p = new Set<GardenPriority>();
  for (const g of goals) {
    switch (g) {
      case "food_production":
      case "savings":
        p.add("salad_greens");
        p.add("fast_harvest");
        break;
      case "wildlife":
      case "pollinator":
        p.add("pest_support");
        p.add("nitrogen_fixers");
        break;
      case "medicinal":
        p.add("salad_greens");
        break;
      case "regenerative":
        p.add("nitrogen_fixers");
        p.add("groundcover_mulch");
        break;
      case "aesthetic":
        p.add("berries");
        break;
      case "low_maintenance":
        p.add("groundcover_mulch");
        p.add("fast_harvest");
        break;
    }
  }
  if (goals.includes("food_production") || goals.includes("savings")) {
    p.add("tropical_fruit");
  }
  return [...p].slice(0, 3);
}

function inferDensity(answers: GardenOnboardingAnswers): PlantingDensity {
  if (
    answers.planting_density === "spacious" ||
    answers.planting_density === "balanced" ||
    answers.planting_density === "dense"
  ) {
    return answers.planting_density;
  }
  const styleDefault = defaultDensityForGardenStyle(answers.garden_style);
  if (answers.space_size === "tiny" || answers.property_type === "container") {
    return answers.maintenance === "intensive" ? "dense" : "balanced";
  }
  if (answers.maintenance === "minimal") return "spacious";
  if (answers.maintenance === "intensive") return "dense";
  if (answers.maintenance === "moderate") return styleDefault;
  return styleDefault;
}

function mapHousehold(property: PropertyType): GardenHousehold {
  if (property === "community") return "community";
  return "family";
}

function buildNotes(answers: GardenOnboardingAnswers): string {
  const lines: string[] = [];
  lines.push(
    `Space: ${answers.space_size} ${answers.property_type} (${SPACE_SIZE_COMPARISONS[answers.space_size]}).`,
  );
  lines.push(
    `Sunlight: ${answers.sunlight}. Maintenance: ${answers.maintenance}. Planting density: ${inferDensity(answers)}.`,
  );
  if (answers.preferences.length) {
    lines.push(`Also wants: ${answers.preferences.join(", ")}.`);
  }
  return lines.join(" ");
}

function applyPreferencePills(
  prefs: GardenPreferences,
  pills: string[],
): GardenPreferences {
  const priorities = new Set(prefs.priorities);
  const uses = new Set(prefs.uses);
  let notes = prefs.notes ?? "";

  for (const pill of pills) {
    switch (pill) {
      case "florida_natives":
        priorities.add("florida_natives");
        uses.add("native_habitat");
        break;
      case "kitchen_herbs":
        uses.add("herbs_tea");
        uses.add("daily_cooking");
        break;
      case "year_round_color":
        uses.add("visual_beauty");
        break;
      case "want_shade":
        uses.add("shade_comfort");
        break;
      case "windbreak":
        notes += " Include windbreak species where possible.";
        break;
      case "medicinal_plants":
        uses.add("medicine_home");
        break;
      case "beneficial_predators":
        uses.add("wildlife_pollinators");
        break;
      case "kid_friendly":
        notes += " Favor kid-safe, non-toxic edibles.";
        break;
      case "pet_safe":
        notes += " Avoid plants toxic to pets.";
        break;
      case "no_invasive":
        break;
    }
  }

  return {
    ...prefs,
    uses: [...uses],
    priorities: [...priorities].slice(0, 3),
    notes: notes.trim(),
  };
}

/** Map onboarding answers to the layout engine preference model. */
export function onboardingToGardenPreferences(
  answers: GardenOnboardingAnswers,
): GardenPreferences {
  const styleDefaults = preferencesFromGardenStyle(answers.garden_style);
  const uses = mapGoalsToUses(answers.goals);
  const priorities = mapGoalsToPriorities(answers.goals);
  const base = buildWizardPreferences({
    gardenStyle: answers.garden_style,
    uses: uses.length ? uses : styleDefaults.uses,
    priorities: priorities.length ? priorities : styleDefaults.priorities,
    time: mapMaintenanceTime(answers.maintenance),
    experience: mapExperience(answers.experience),
    sun: mapSunlight(answers.sunlight),
    water: mapWater(answers.water),
    household: mapHousehold(answers.property_type),
    density: inferDensity(answers),
    notes: buildNotes(answers),
  });
  return applyPreferencePills(base, answers.preferences);
}

export function onboardingProfileText(answers: GardenOnboardingAnswers): string {
  const dims = resolveOnboardingBedDimensions(answers);
  const goalLabels = answers.goals
    .map((g) => ONBOARDING_GOAL_LABELS[g].title)
    .join(", ");
  const prefs = answers.preferences.length
    ? answers.preferences.join(", ")
    : "none specified";

  const spaceLine =
    answers.space_source === "canvas_zone"
      ? `Space: bed drawn on their plan (~${Math.round(dims.areaSqFt)} sq ft, ${dims.widthFeet}×${dims.heightFeet} ft equivalent layout box)`
      : answers.space_source === "custom_feet"
        ? `Space: custom bed ${dims.widthFeet}×${dims.heightFeet} ft (~${Math.round(dims.areaSqFt)} sq ft)`
        : `Space: ${answers.space_size} ${answers.property_type} (~${dims.areaSqFt} sq ft, ${dims.widthFeet}×${dims.heightFeet} ft bed)`;

  const region = answers.florida_region
    ? floridaRegionById(answers.florida_region)
    : undefined;
  const zone =
    answers.hardiness_zone?.trim() ||
    (answers.florida_region
      ? hardinessZoneForFloridaRegion(answers.florida_region)
      : "10a");
  const locationLine = region
    ? `Location: ${region.label}, Florida (USDA zone ${zone})`
    : `Location: Florida (USDA zone ${zone})`;

  return `Design a personalized Florida garden for someone with the following profile:

Garden type: ${GARDEN_STYLE_LABELS[answers.garden_style]}
${locationLine}
${spaceLine}
Size reference: ${SPACE_SIZE_COMPARISONS[answers.space_size]}
Main goals: ${goalLabels}
Sunlight: ${answers.sunlight}
Maintenance commitment: ${answers.maintenance}
Water availability: ${answers.water}
Special preferences: ${prefs}
Experience level: ${answers.experience}`;
}

export function deriveGoalsFromOnboarding(
  answers: GardenOnboardingAnswers,
): FoodForestLayoutGoal[] {
  return deriveGoalsFromPreferences(onboardingToGardenPreferences(answers));
}

