import type { Plant } from "../schema.js";

/** Families commonly grown for food in Florida / subtropics */
const EDIBLE_FAMILY_RE =
  /^(rutaceae|moraceae|caricaceae|musaceae|anacardiaceae|myrtaceae|passifloraceae|zingiberaceae|solanaceae|fabaceae|arecaceae|lauraceae|euphorbiaceae|sapindaceae|annonaceae|bromeliaceae|amaryllidaceae|apiaceae|lamiaceae|convolvulaceae|araceae)$/i;

/** Genera / species epithets that are reliably food plants */
const EDIBLE_TAXON_RE =
  /\b(mangifera|carica|persea|citrus|musa|psidium|annona|passiflora|moringa|ipomoea batatas|cajanus|zingiber|curcuma|cymbopogon|ocimum|solanum lycopersicum|capsicum|hibiscus sabdariffa|manihot|artocarpus|litchi|dimocarpus|nephelium|averrhoa|pouteria|cananga|punica)\b/i;

const EDIBLE_COMMON_RE =
  /\b(mango|papaya|avocado|banana|plantain|guava|passion\s*fruit|starfruit|carambola|lychee|longan|rambutan|jackfruit|breadfruit|soursop|sugar apple|custard apple|mulberry|fig tree|edible fig|citrus|lemon|lime|orange|grapefruit|mandarin|tangerine|kumquat|pomelo|calamondin|key lime|meyer lemon|tomato|pepper|chili|jalapeño|eggplant|basil|mint|oregano|thyme|rosemary|sage|ginger|turmeric|galangal|lemongrass|cilantro|coriander|parsley|dill|chive|garlic|onion|shallot|sweet potato|yam\b|cassava|taro|moringa|drumstick tree|pigeon pea|comfrey|roselle|florida cranberry|blueberry|strawberry|blackberry|pineapple|date palm|coconut|sugarcane|okra|squash|pumpkin|cucumber|melon|watermelon|green bean|snap bean|lima bean|peanut|sunflower|sesame|pecan|macadamia|cashew|pomegranate|persimmon|loquat|jujube|sapodilla|miracle fruit|ackee|callaloo|amaranth|malabar spinach|katuk|cranberry hibiscus|surinam cherry|barbados cherry|acerola|mamey|sapote|canistel|abiu)\b/i;

/** Clearly ornamental — avoid false positives */
const ORNAMENTAL_ONLY_RE =
  /\b(silver fir|colorado fir|fraser fir|spruce|juniper|boxwood|ornamental pear|ornamental cherry|foundation planting)\b/i;

export function inferIsEdibleFromPlant(plant: {
  common_name: string;
  scientific_name: string;
  uses?: string[];
  tags?: string[];
  category?: string;
  is_edible?: boolean;
}): boolean {
  if (plant.is_edible) return true;

  const uses = plant.uses ?? [];
  if (uses.some((u) => /edible|culinary|food|fruit|kitchen/i.test(u))) {
    return true;
  }

  if (plant.tags?.some((t) => t.toLowerCase() === "edible")) {
    return true;
  }

  const blob = `${plant.common_name} ${plant.scientific_name}`.toLowerCase();

  if (ORNAMENTAL_ONLY_RE.test(blob)) {
    return false;
  }

  if (EDIBLE_COMMON_RE.test(blob)) return true;
  if (EDIBLE_TAXON_RE.test(plant.scientific_name)) return true;

  const familyTag = plant.tags?.find((t) => EDIBLE_FAMILY_RE.test(t));
  if (familyTag && EDIBLE_COMMON_RE.test(blob)) return true;

  const familyFromName = plant.scientific_name.split(" ")[0];
  if (plant.category && /fruit|citrus|herb|vegetable|berry|palm/i.test(plant.category)) {
    if (EDIBLE_COMMON_RE.test(blob) || EDIBLE_TAXON_RE.test(plant.scientific_name)) {
      return true;
    }
  }

  return false;
}

export function applyEdibleFlag(plant: Plant): Plant {
  return {
    ...plant,
    is_edible: inferIsEdibleFromPlant(plant),
  };
}
