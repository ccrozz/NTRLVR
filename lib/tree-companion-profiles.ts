/**
 * Species-specific companion plants for fruit trees, citrus, berries, palms,
 * and tropical fruits. Sourced from UF/IFAS food-forest guides, tropical
 * polyculture references, and regional permaculture guild patterns.
 *
 * Keys: normalized scientific name (lowercase, × → x).
 */
export const TREE_COMPANION_PROFILES: Record<string, string[]> = {
  // —— Tropical canopy staples ——
  "mangifera indica": [
    "Moringa",
    "Turmeric",
    "Lemongrass",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "persea americana": [
    "Glenn Mango",
    "Comfrey",
    "Pigeon Pea",
    "Lemongrass",
    "Rosemary",
  ],
  "carica papaya": [
    "Lemongrass",
    "Edible Ginger",
    "French Marigold",
    "Sweet Potato",
    "Comfrey",
  ],
  "musa acuminata": [
    "Pigeon Pea",
    "Sweet Potato",
    "Lemongrass",
    "Edible Ginger",
    "Comfrey",
  ],
  "musa x paradisiaca": [
    "Pigeon Pea",
    "Sweet Potato",
    "Lemongrass",
    "Cassava (Yuca)",
    "Comfrey",
  ],

  // —— Annona family ——
  "annona squamosa": [
    "Lemongrass",
    "Sweet Potato",
    "French Marigold",
    "Pigeon Pea",
  ],
  "annona muricata": ["Red Lady Papaya", "Apple Banana", "Lemongrass", "Comfrey"],
  "annona reticulata": [
    "French Marigold",
    "Sweet Potato",
    "Genovese Basil",
    "Pigeon Pea",
  ],
  "annona cherimola": ["Brogdon Avocado", "Lemongrass", "Comfrey", "Sweet Potato"],
  "annona glabra": [
    "Firebush",
    "Coontie",
    "American Beautyberry",
    "Sweet Potato",
  ],
  "annona x atemoya": ["Sugar Apple", "Glenn Mango", "Lemongrass", "Comfrey"],
  "rollinia deliciosa": [
    "Pigeon Pea",
    "Lemongrass",
    "Sweet Potato",
    "French Marigold",
  ],
  "rollinia mucosa": ["Red Lady Papaya", "Pigeon Pea", "Lemongrass", "French Marigold"],

  // —— Citrus (each species differs in size, timing, and pest pressure) ——
  "citrus sinensis": [
    "Comfrey",
    "French Marigold",
    "Pigeon Pea",
    "Nasturtium",
  ],
  "citrus x paradisi": [
    "Comfrey",
    "Rosemary",
    "Pigeon Pea",
    "French Marigold",
  ],
  "citrus limon": [
    "Comfrey",
    "French Marigold",
    "Rosemary",
    "Genovese Basil",
  ],
  "citrus x aurantiifolia": [
    "Comfrey",
    "Rosemary",
    "Lemongrass",
    "French Marigold",
  ],
  "citrus x latifolia": [
    "Comfrey",
    "Rosemary",
    "Lemongrass",
    "French Marigold",
  ],
  "citrus x limonia": ["Comfrey", "Rosemary", "French Marigold", "Pigeon Pea"],
  "citrus x meyeri": ["Rosemary", "Comfrey", "Lemongrass", "French Marigold"],
  "citrus reticulata": [
    "Comfrey",
    "French Marigold",
    "Pigeon Pea",
    "Nasturtium",
  ],
  "citrus tangerina": [
    "Comfrey",
    "French Marigold",
    "Pigeon Pea",
    "Nasturtium",
  ],
  "citrus unshiu": ["Comfrey", "Rosemary", "French Marigold", "Pigeon Pea"],
  "citrus maxima": ["Comfrey", "Rosemary", "Pigeon Pea", "French Marigold"],
  "citrus latifolia": ["Comfrey", "Rosemary", "Lemongrass", "French Marigold"],
  "citrus junos": ["Comfrey", "Rosemary", "French Marigold", "Garden Sage"],
  "citrus australasica": [
    "Comfrey",
    "Rosemary",
    "French Marigold",
    "Pigeon Pea",
  ],
  "citrus medica var. sarcodactylis": [
    "Comfrey",
    "Rosemary",
    "Lemongrass",
    "French Marigold",
  ],
  "citrus x tangelo": [
    "Comfrey",
    "Rosemary",
    "French Marigold",
    "Pigeon Pea",
  ],
  "fortunella margarita": [
    "Comfrey",
    "Rosemary",
    "Lavender",
    "French Marigold",
  ],
  "fortunella crassifolia": [
    "Comfrey",
    "Rosemary",
    "Lavender",
    "French Marigold",
  ],
  "x citrofortunella microcarpa": [
    "Comfrey",
    "Rosemary",
    "French Marigold",
    "Pigeon Pea",
  ],
  "x citrofortunella floridana": [
    "Comfrey",
    "Rosemary",
    "French Marigold",
    "Lemongrass",
  ],

  // —— Temperate & subtropical fruit trees (Florida) ——
  "malus domestica": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Chives",
    "Garden Sage",
  ],
  "prunus persica": [
    "Comfrey",
    "Nasturtium",
    "Chives",
    "French Marigold",
  ],
  "prunus persica var. nucipersica": [
    "Comfrey",
    "Nasturtium",
    "Chives",
    "French Marigold",
  ],
  "prunus salicina": [
    "Comfrey",
    "Chives",
    "French Marigold",
    "Nasturtium",
  ],
  "pyrus communis": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Chives",
  ],
  "ficus carica": [
    "Comfrey",
    "French Marigold",
    "Rosemary",
    "Sweet Potato",
  ],
  "eriobotrya japonica": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Chives",
  ],
  "diospyros virginiana": [
    "Comfrey",
    "Pigeon Pea",
    "Serviceberry (Juneberry)",
    "Sweet Potato",
  ],
  "diospyros kaki": [
    "Comfrey",
    "Chives",
    "French Marigold",
    "Nasturtium",
  ],
  "carya illinoinensis": [
    "Comfrey",
    "Pigeon Pea",
    "Sweet Potato",
    "French Marigold",
  ],
  "punica granatum": [
    "Lavender",
    "Rosemary",
    "Comfrey",
    "Thyme",
  ],
  "olea europaea": ["Lavender", "Rosemary", "Comfrey", "Garden Sage"],
  "asimina triloba": [
    "Comfrey",
    "Pigeon Pea",
    "Serviceberry (Juneberry)",
    "Sweet Potato",
  ],
  "ziziphus jujuba": [
    "Comfrey",
    "Lavender",
    "French Marigold",
    "Sweet Potato",
  ],
  "acca sellowiana": [
    "Lavender",
    "Rosemary",
    "Comfrey",
    "French Marigold",
  ],
  "crataegus aestivalis": [
    "Comfrey",
    "Pigeon Pea",
    "Firebush",
    "Sweet Potato",
  ],
  "cydonia oblonga": ["Comfrey", "Lavender", "Nasturtium", "Chives"],

  // —— Tropical fruits ——
  "artocarpus altilis": [
    "Pigeon Pea",
    "Sweet Potato",
    "Apple Banana",
    "Comfrey",
  ],
  "artocarpus heterophyllus": [
    "Moringa",
    "Pigeon Pea",
    "Sweet Potato",
    "Lemongrass",
  ],
  "litchi chinensis": [
    "Comfrey",
    "Edible Ginger",
    "French Marigold",
    "Sweet Potato",
  ],
  "dimocarpus longan": [
    "Pigeon Pea",
    "Lemongrass",
    "Edible Ginger",
    "Sweet Potato",
  ],
  "averrhoa carambola": ["Red Lady Papaya", "Lemongrass", "Edible Ginger", "Comfrey"],
  "psidium guajava": [
    "French Marigold",
    "Lemongrass",
    "Edible Ginger",
    "Sweet Potato",
  ],
  "psidium cattleyanum": [
    "Firebush",
    "Sweet Potato",
    "Comfrey",
    "Lemongrass",
  ],
  "psidium littorale": [
    "Comfrey",
    "Lemongrass",
    "French Marigold",
    "Sweet Potato",
  ],
  "syzygium malaccense": [
    "Moringa",
    "Comfrey",
    "Lemongrass",
    "Pigeon Pea",
  ],
  "syzygium samarangense": [
    "Moringa",
    "Lemongrass",
    "Sweet Potato",
    "Comfrey",
  ],
  "pouteria sapota": [
    "Moringa",
    "Comfrey",
    "Lemongrass",
    "Edible Ginger",
  ],
  "pouteria campechiana": [
    "Moringa",
    "Comfrey",
    "Sweet Potato",
    "French Marigold",
  ],
  "pouteria caimito": [
    "Comfrey",
    "Sweet Potato",
    "Lemongrass",
    "Pigeon Pea",
  ],
  "pouteria lucuma": [
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "manilkara zapota": [
    "Moringa",
    "Comfrey",
    "Sweet Potato",
    "Edible Ginger",
  ],
  "casimiroa edulis": ["Comfrey", "Brogdon Avocado", "Lemongrass", "Sweet Potato"],
  "diospyros nigra": ["Glenn Mango", "Comfrey", "Lemongrass", "Sweet Potato"],
  "chrysophyllum cainito": [
    "Moringa",
    "Comfrey",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "garcinia mangostana": ["Moringa", "Comfrey", "Lemongrass", "Edible Ginger"],
  "nephelium lappaceum": ["Moringa", "Comfrey", "Apple Banana", "Lemongrass"],
  "durio zibethinus": ["Moringa", "Comfrey", "Apple Banana", "Pigeon Pea"],
  "plinia cauliflora": [
    "Comfrey",
    "Sweet Potato",
    "Lemongrass",
    "Pigeon Pea",
  ],
  "plinia jaboticaba": [
    "Comfrey",
    "Sweet Potato",
    "Lemongrass",
    "Pigeon Pea",
  ],
  "eugenia involucrata": [
    "Comfrey",
    "Lemongrass",
    "French Marigold",
    "Sweet Potato",
  ],
  "eugenia brasiliensis": [
    "Comfrey",
    "French Marigold",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "eugenia luschnathiana": [
    "Firebush",
    "Comfrey",
    "Sweet Potato",
    "Lemongrass",
  ],
  "inga edulis": ["Moringa", "Glenn Mango", "Sweet Potato", "Pigeon Pea"],
  "theobroma cacao": [
    "Apple Banana",
    "Ice Cream Bean",
    "Comfrey",
    "Lemongrass",
  ],
  "coffea arabica": [
    "Apple Banana",
    "Comfrey",
    "Lemongrass",
    "Garden Sage",
  ],
  "macadamia integrifolia": [
    "Comfrey",
    "Pigeon Pea",
    "French Marigold",
    "Sweet Potato",
  ],
  "hylocereus undatus": [
    "Pigeon Pea",
    "French Marigold",
    "Sweet Potato",
    "Comfrey",
  ],
  "monstera deliciosa": [
    "Pigeon Pea",
    "French Marigold",
    "Sweet Potato",
    "Ice Cream Bean",
  ],
  "synsepalum dulcificum": [
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "French Marigold",
  ],
  "bunchosia argentea": [
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "brosimum alicastrum": [
    "Moringa",
    "Pigeon Pea",
    "Sweet Potato",
    "Comfrey",
  ],
  "cananga odorata": ["Moringa", "Comfrey", "Lemongrass", "Firebush"],
  "ananas comosus": [
    "French Marigold",
    "Sweet Potato",
    "Pigeon Pea",
    "Comfrey",
  ],
  "moringa oleifera": ["Glenn Mango", "Brogdon Avocado", "Sweet Potato", "Pigeon Pea"],

  // —— Berries & small fruit ——
  "vaccinium virgatum": [
    "Comfrey",
    "French Marigold",
    "Garden Sage",
    "Thyme",
  ],
  "vaccinium corymbosum": [
    "Comfrey",
    "French Marigold",
    "Garden Sage",
    "Thyme",
  ],
  "rubus idaeus": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Thyme",
  ],
  "rubus fruticosus": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Thyme",
  ],
  "rubus niveus": [
    "Comfrey",
    "French Marigold",
    "Lemongrass",
    "Sweet Potato",
  ],
  "fragaria x ananassa": [
    "French Marigold",
    "Thyme",
    "Chives",
    "Comfrey",
  ],
  "morus rubra": [
    "Comfrey",
    "Pigeon Pea",
    "Serviceberry (Juneberry)",
    "Firebush",
  ],
  "morus nigra": [
    "Comfrey",
    "French Marigold",
    "Nasturtium",
    "Sweet Potato",
  ],
  "eugenia uniflora": [
    "Firebush",
    "Sweet Potato",
    "Comfrey",
    "Lemongrass",
  ],
  "malpighia emarginata": [
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "Firebush",
  ],
  "sambucus canadensis": [
    "Comfrey",
    "French Marigold",
    "Pigeon Pea",
    "Sweet Potato",
  ],
  "amelanchier arborea": [
    "Comfrey",
    "Firebush",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "carissa macrocarpa": [
    "Comfrey",
    "Rosemary",
    "Sweet Potato",
    "Firebush",
  ],
  "elaeagnus multiflora": [
    "Serviceberry (Juneberry)",
    "French Marigold",
    "Comfrey",
    "Chives",
  ],
  "dovyalis caffra": [
    "Comfrey",
    "Pigeon Pea",
    "Lemongrass",
    "Sweet Potato",
  ],
  "lycium barbarum": [
    "French Marigold",
    "Thyme",
    "Comfrey",
    "Rosemary",
  ],
  "viburnum opulus": [
    "Comfrey",
    "Firebush",
    "Sweet Potato",
    "Gayfeather",
  ],

  // —— Palms ——
  "cocos nucifera": ["Apple Banana", "Pigeon Pea", "Sweet Potato", "Pineapple"],
  "roystonea regia": [
    "Firebush",
    "Coontie",
    "Sweet Potato",
    "American Beautyberry",
  ],
  "syagrus romanzoffiana": [
    "Firebush",
    "Sweet Potato",
    "Comfrey",
    "Coontie",
  ],
  "wodyetia bifurcata": [
    "Firebush",
    "Coontie",
    "Saw Palmetto",
    "Sweet Potato",
  ],
  "sabal palmetto": [
    "Coontie",
    "Firebush",
    "American Beautyberry",
    "Sweet Potato",
  ],
  "serenoa repens": [
    "Coontie",
    "Firebush",
    "American Beautyberry",
    "Prickly Pear Cactus",
  ],
  "phoenix dactylifera": [
    "Comfrey",
    "Lavender",
    "Rosemary",
    "Pigeon Pea",
  ],
  "butia capitata": [
    "Comfrey",
    "Rosemary",
    "Sweet Potato",
    "Pigeon Pea",
  ],
};

/** Cultivar-level overrides when the same species needs a different guild. */
export const TREE_COMPANION_BY_PLANT_ID: Record<string, string[]> = {
  // Mango cultivars — size, season, and pest pressure differ
  "mango-glenn": [
    "Turmeric",
    "Lemongrass",
    "Sweet Potato",
    "French Marigold",
    "Comfrey",
  ],
  "mango-irwin": [
    "Comfrey",
    "Turmeric",
    "Sweet Potato",
    "French Marigold",
    "Lemongrass",
  ],
  "mango-haden": [
    "Moringa",
    "Pigeon Pea",
    "Lemongrass",
    "Sweet Potato",
    "Turmeric",
  ],
  "mango-keitt": [
    "Moringa",
    "Pigeon Pea",
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
  ],
  "mango-kent": [
    "Lemongrass",
    "Sweet Potato",
    "French Marigold",
    "Pigeon Pea",
    "Comfrey",
  ],
  "mango-tommy-atkins": [
    "French Marigold",
    "Lemongrass",
    "Moringa",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "mango-valencia-pride": [
    "Moringa",
    "Pigeon Pea",
    "Comfrey",
    "Lemongrass",
    "Turmeric",
  ],
  "mango-nam-doc-mai": [
    "Edible Ginger",
    "Lemongrass",
    "Sweet Potato",
    "Comfrey",
    "Turmeric",
  ],

  // Avocado types — pollination, drainage, and cold tolerance differ
  "avocado-hass": [
    "Glenn Mango",
    "Comfrey",
    "Rosemary",
    "French Marigold",
    "Pigeon Pea",
  ],
  "avocado-brogdon": [
    "Glenn Mango",
    "Comfrey",
    "Pigeon Pea",
    "Lemongrass",
    "Sweet Potato",
  ],
  "avocado-choquette": [
    "Moringa",
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "Pigeon Pea",
  ],
  "avocado-lula": [
    "Glenn Mango",
    "Comfrey",
    "Rosemary",
    "Pigeon Pea",
    "Lemongrass",
  ],
  "avocado-monroe": [
    "Moringa",
    "Comfrey",
    "Lemongrass",
    "Sweet Potato",
    "Pigeon Pea",
  ],
};

function normalizeScientific(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tailored companion list for a fruiting tree or shrub species, if known. */
export function treeCompanionPlants(
  scientificName: string,
  plantId?: string,
): string[] | undefined {
  if (plantId) {
    const byId = TREE_COMPANION_BY_PLANT_ID[plantId];
    if (byId?.length) return byId.slice(0, 8);
  }
  const key = normalizeScientific(scientificName);
  const list = TREE_COMPANION_PROFILES[key];
  if (!list?.length) return undefined;
  return list.slice(0, 8);
}
