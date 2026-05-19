/** Hand-curated Florida food-forest relations (from original seed data). */

type CuratedEntry = {
  benefits?: string[];
  companion_plants?: string[];
  avoid_planting_near?: string[];
};

/** Normalized scientific name → curated relations */
const BY_SCIENTIFIC: Record<string, CuratedEntry> = {
  "mangifera indica": {
    benefits: [
      "High in vitamins C and A",
      "Dense canopy shade",
      "Attracts birds and pollinators",
    ],
    companion_plants: ["Moringa", "Lemongrass", "Sweet Potato"],
  },
  "persea americana": {
    benefits: ["Rich in healthy fats and potassium", "Large canopy reduces heat"],
    companion_plants: ["Mango", "Moringa", "Comfrey"],
  },
  "citrus × meyeri": {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass"],
    avoid_planting_near: ["Basil (competes for nutrients)"],
  },
  "citrus x meyeri": {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass"],
    avoid_planting_near: ["Basil (competes for nutrients)"],
  },
  "morus macroura": {
    companion_plants: ["Comfrey", "Sweet Potato", "Pigeon Pea"],
  },
  "carica papaya": {
    companion_plants: ["Lemongrass", "Sweet Potato"],
    benefits: ["Fast fruiting", "Rich in vitamins and enzymes"],
  },
  "sabal palmetto": {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry"],
    benefits: ["Florida native", "Wildlife habitat", "Hurricane wind resistant"],
  },
  "zamia integrifolia": {
    companion_plants: ["Sabal Palm", "Firebush", "American Beautyberry"],
    benefits: ["Florida native coontie", "Host plant for atala butterfly"],
  },
  "hamelia patens": {
    companion_plants: ["Coontie", "American Beautyberry", "Moringa"],
    benefits: ["Pollinator magnet", "Hummingbird favorite"],
  },
  "callicarpa americana": {
    companion_plants: ["Coontie", "Firebush", "Sabal Palm"],
    benefits: ["Native berries for birds", "Low maintenance understory"],
  },
  "salvia rosmarinus": {
    companion_plants: ["Meyer Lemon", "Sage", "Lavender"],
    benefits: ["Pest repellent aromatics", "Drought tolerant herb"],
  },
  "cymbopogon citratus": {
    companion_plants: ["Mango", "Papaya", "Ginger"],
    benefits: ["Repels mosquitoes", "Living mulch edge plant"],
  },
  "zingiber officinale": {
    companion_plants: ["Avocado", "Mango", "Turmeric"],
  },
  "moringa oleifera": {
    companion_plants: ["Mango", "Avocado", "Sweet Potato"],
    benefits: ["Nitrogen-rich leaves for chop-and-drop", "Highly nutritious leaves"],
  },
  "cajanus cajan": {
    companion_plants: ["Mango", "Avocado", "Moringa", "Mulberry"],
    benefits: ["Nitrogen-fixing support species", "Edible peas and pods"],
  },
  "symphytum × uplandicum": {
    companion_plants: ["Avocado", "Meyer Lemon", "Mulberry"],
    benefits: ["Dynamic accumulator — deep minerals in leaves"],
  },
  "symphytum x uplandicum": {
    companion_plants: ["Avocado", "Meyer Lemon", "Mulberry"],
    benefits: ["Dynamic accumulator — deep minerals in leaves"],
  },
  "ipomoea batatas": {
    companion_plants: ["Mango", "Moringa", "Pigeon Pea"],
    benefits: ["Living groundcover mulch", "Edible tubers and leaves"],
  },
  "curcuma longa": {
    companion_plants: ["Ginger", "Avocado", "Mango"],
  },
  "hibiscus sabdariffa": {
    companion_plants: ["Firebush", "Pigeon Pea", "Lemongrass"],
  },
  "dimocarpus longan": {
    companion_plants: ["Pigeon Pea", "Moringa", "Sweet Potato"],
  },
};

function normalizeScientific(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

export function lookupCuratedKnowledge(
  scientificName: string,
): CuratedEntry {
  const key = normalizeScientific(scientificName);
  return BY_SCIENTIFIC[key] ?? {};
}

const FLORIDA_NATIVE_SCIENTIFIC = new Set([
  "sabal palmetto",
  "zamia integrifolia",
  "hamelia patens",
  "callicarpa americana",
]);

export function curatedPatchForPlant(scientificName: string): {
  benefits?: string[];
  companion_plants?: string[];
  avoid_planting_near?: string[];
  native_states?: string[];
  is_florida_native?: boolean;
} {
  const entry = lookupCuratedKnowledge(scientificName);
  const key = scientificName.toLowerCase().replace(/×/g, "x").trim();
  const native_states = FLORIDA_NATIVE_SCIENTIFIC.has(key) ? ["FL"] : undefined;

  if (
    !entry.benefits &&
    !entry.companion_plants &&
    !entry.avoid_planting_near &&
    !native_states
  ) {
    return {};
  }
  return {
    benefits: entry.benefits,
    companion_plants: entry.companion_plants,
    avoid_planting_near: entry.avoid_planting_near,
    native_states,
    is_florida_native: native_states?.includes("FL"),
  };
}
