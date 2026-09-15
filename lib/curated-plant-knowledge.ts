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
      "Mango flesh is rich in vitamins A and C — eat fresh, dried, or blended",
      "Dense evergreen canopy casts deep shade for understory herbs",
      "Spring flowers draw bees before the summer fruit flush",
    ],
    companion_plants: ["Moringa", "Lemongrass", "Sweet Potato"],
  },
  "persea americana": {
    benefits: [
      "Avocado fruit is packed with healthy fats and potassium",
      "Broad canopy cools the yard and shelters shade-loving companions",
      "Long harvest window once trees are mature in south Florida",
    ],
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
    benefits: [
      "Long mulberry fruiting season — soft berries for fresh eating and birds",
      "Fast-growing understory tree that fills gaps between larger canopies",
    ],
  },
  "carica papaya": {
    companion_plants: ["Lemongrass", "Sweet Potato"],
    benefits: [
      "Papaya fruit is enzyme-rich — papain aids digestion and tenderizes food",
      "Fruits within a year on warm south Florida sites",
      "Hollow trunk and light canopy leave room for understory herbs",
    ],
  },
  "pouteria caimito": {
    benefits: [
      "Abiu fruit has custard-sweet translucent pulp — eat fresh when the skin softens",
      "Amazonian sapote relative prized as a dessert fruit in south Florida yards",
      "Evergreen canopy casts deep shade for understory herbs and groundcovers",
      "Latex-rich sap historically used as chewing gum before fruit sweetens",
    ],
    companion_plants: ["Comfrey", "Sweet Potato", "Lemongrass", "Pigeon Pea"],
  },
  "pouteria sapota": {
    benefits: [
      "Mamey sapote flesh is sweet and pumpkin-like — classic Cuban dessert fruit",
      "Large evergreen tree for long-term calories in frost-free Florida",
      "Dense canopy cools the understory once the tree fills in",
    ],
    companion_plants: ["Pigeon Pea", "Sweet Potato", "Lemongrass"],
  },
  "pouteria lucuma": {
    benefits: [
      "Lucuma pulp tastes maple-sweet — popular dried or blended into desserts",
      "Andean sapote that needs a warm, frost-free south Florida microclimate",
    ],
  },
  "diospyros nigra": {
    benefits: [
      "Black sapote softens into chocolate-pudding flesh when fully ripe",
      "Evergreen canopy fruit for frost-free yards — harvest late in the season",
    ],
    companion_plants: ["Pigeon Pea", "Comfrey", "Sweet Potato"],
  },
  "casimiroa edulis": {
    benefits: [
      "White sapote is soft and custard-sweet — eat fresh when the fruit yields",
      "Handles slightly cooler spots than many tropicals (into 9b with protection)",
    ],
  },
  "chrysophyllum cainito": {
    benefits: [
      "Star apple flesh is jelly-sweet — slice crosswise to reveal the star pattern",
      "Attractive copper-backed leaves add ornamental value to the canopy",
    ],
  },
  "annona cherimola": {
    benefits: [
      "Cherimoya flesh is creamy and pineapple-banana sweet — eat with a spoon",
      "Understory annona that prefers filtered light and protection from wind",
    ],
  },
  "annona × atemoya": {
    benefits: [
      "Atemoya blends cherimoya and sugar apple — sweet custard flesh for fresh eating",
      "More humid-heat tolerant than cherimoya alone in south Florida",
    ],
  },
  "annona x atemoya": {
    benefits: [
      "Atemoya blends cherimoya and sugar apple — sweet custard flesh for fresh eating",
      "More humid-heat tolerant than cherimoya alone in south Florida",
    ],
  },
  "annona reticulata": {
    benefits: [
      "Custard apple flesh is soft and sweet — harvest when the skin softens",
      "Compact understory tree that fits under taller tropical canopies",
    ],
  },
  "annona glabra": {
    benefits: [
      "Pond apple is a Florida-native wetland annona — fruit edible, often used as rootstock",
      "Tolerates wet soils where most tropical fruit trees fail",
    ],
  },
  "rollinia deliciosa": {
    benefits: [
      "Rollinia fruit is lemon-custard sweet with soft spines — eat fresh when yellow",
      "Fast understory tropical for frost-free microclimates",
    ],
  },
  "rollinia mucosa": {
    benefits: [
      "Biriba (lemon drop fruit) has soft yellow flesh with a citrus-custard flavor",
      "Compact understory tree for warm south Florida food forests",
    ],
  },
  "artocarpus altilis": {
    benefits: [
      "Breadfruit is a starchy staple — roast, boil, or fry like potato or plantain",
      "Huge canopy tree for serious calories in frost-free south Florida",
    ],
  },
  "nephelium lappaceum": {
    benefits: [
      "Rambutan flesh is grape-lychee sweet under the hairy rind",
      "Needs humid heat and frost-free sites — a south Florida specialty fruit",
    ],
  },
  "dimocarpus longan": {
    companion_plants: ["Pigeon Pea", "Moringa", "Sweet Potato"],
    benefits: [
      "Longan fruit is translucent and musky-sweet — eat fresh or dried",
      "Related to lychee but often more heat-tolerant in south Florida summers",
    ],
  },
  "synsepalum dulcificum": {
    benefits: [
      "Miracle fruit temporarily makes sour foods taste sweet — a party-trick berry",
      "Compact shade-tolerant shrub for the understory layer",
    ],
  },
  "bunchosia argentea": {
    benefits: [
      "Peanut butter fruit tastes nutty-sweet when fully ripe — snack straight from the shrub",
      "Small footprint shrub that fits along paths and bed edges",
    ],
  },
  "inga edulis": {
    benefits: [
      "Ice cream bean pods hold sweet cottony pulp around the seeds",
      "Nitrogen-fixing overstory that feeds soil while producing a snack crop",
    ],
  },
  "punica granatum": {
    benefits: [
      "Pomegranate arils are tart-sweet — juice, sprinkle on salads, or eat fresh",
      "Drought-tolerant shrub layer fruit for north and central Florida",
    ],
  },
  "sabal palmetto": {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry"],
    benefits: [
      "Florida’s state tree — hurricane-tough structure and wildlife habitat",
      "Historically harvested palm heart; now mainly ornamental and ecological",
    ],
  },
  "zamia integrifolia": {
    companion_plants: ["Sabal Palm", "Firebush", "American Beautyberry"],
    benefits: [
      "Florida native coontie — host plant for the rare atala butterfly",
      "Tough understory cycad for dry, sandy Florida soils",
    ],
  },
  "hamelia patens": {
    companion_plants: ["Coontie", "American Beautyberry", "Moringa"],
    benefits: [
      "Firebush nectar is a hummingbird and butterfly magnet",
      "Native shrub that blooms nearly year-round in warm Florida",
    ],
  },
  "callicarpa americana": {
    companion_plants: ["Coontie", "Firebush", "Sabal Palm"],
    benefits: [
      "American beautyberry loads purple fruit for birds in fall",
      "Low-maintenance native understory for Florida yards",
    ],
  },
  "salvia rosmarinus": {
    companion_plants: ["Meyer Lemon", "Sage", "Lavender"],
    benefits: [
      "Rosemary aromatics help confuse pests around citrus and vegetables",
      "Drought-tolerant culinary herb for sunny bed edges",
    ],
  },
  "cymbopogon citratus": {
    companion_plants: ["Mango", "Papaya", "Ginger"],
    benefits: [
      "Lemongrass oils help repel mosquitoes along bed edges",
      "Living mulch clump with culinary stalks for teas and cooking",
    ],
  },
  "zingiber officinale": {
    companion_plants: ["Avocado", "Mango", "Turmeric"],
    benefits: [
      "Fresh ginger rhizomes for cooking, tea, and medicine",
      "Understory spice that thrives in filtered light under fruit trees",
    ],
  },
  "moringa oleifera": {
    companion_plants: ["Mango", "Avocado", "Sweet Potato"],
    benefits: [
      "Moringa leaves are highly nutritious — cook as greens or dry into powder",
      "Nitrogen-rich chop-and-drop biomass for fruit-tree guilds",
    ],
  },
  "cajanus cajan": {
    companion_plants: ["Mango", "Avocado", "Moringa", "Mulberry"],
    benefits: [
      "Pigeon pea fixes nitrogen while yielding edible peas and pods",
      "Fast shrub-layer support species for young food forests",
    ],
  },
  "symphytum × uplandicum": {
    companion_plants: ["Avocado", "Meyer Lemon", "Mulberry"],
    benefits: [
      "Comfrey is a dynamic accumulator — deep minerals concentrated in leaves",
      "Chop-and-drop mulch plant for the drip line of fruit trees",
    ],
  },
  "symphytum x uplandicum": {
    companion_plants: ["Avocado", "Meyer Lemon", "Mulberry"],
    benefits: [
      "Comfrey is a dynamic accumulator — deep minerals concentrated in leaves",
      "Chop-and-drop mulch plant for the drip line of fruit trees",
    ],
  },
  "ipomoea batatas": {
    companion_plants: ["Mango", "Moringa", "Pigeon Pea"],
    benefits: [
      "Sweet potato vines are living groundcover mulch under fruit trees",
      "Edible tubers and tips — calories from the groundcover layer",
    ],
  },
  "curcuma longa": {
    companion_plants: ["Ginger", "Avocado", "Mango"],
    benefits: [
      "Turmeric rhizomes for cooking and golden teas",
      "Understory spice that shares the ginger bed under canopy",
    ],
  },
  "hibiscus sabdariffa": {
    companion_plants: ["Firebush", "Pigeon Pea", "Lemongrass"],
    benefits: [
      "Roselle calyces make tart Florida cranberry teas and jams",
      "Annual shrub that fills the herbaceous layer in one warm season",
    ],
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
