/**
 * UF/IFAS landscape staples, turf alternatives, and common FL ornamentals
 * not already in the food-forest comprehensive list.
 */
import { compactSeeds } from "./seed-helpers.js";

const LANDSCAPE_SHRUBS = compactSeeds([
  { id: "bougainvillea", name: "Bougainvillea", sci: "Bougainvillea spp.", cat: "Native Shrub", layer: "Shrub", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [8, 20], s: [6, 12], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"], note: "UF/IFAS flowering hedge; drought-tolerant once established." },
  { id: "ixora-nora-grant", name: "Ixora (Nora Grant)", sci: "Ixora coccinea", cat: "Native Shrub", layer: "Shrub", zones: ["10a", "10b", "11a"], eat: false, h: [4, 6], s: [3, 5], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor"] },
  { id: "croton-petra", name: "Croton (Petra)", sci: "Codiaeum variegatum", cat: "Native Shrub", layer: "Shrub", zones: ["10a", "10b", "11a"], eat: false, h: [4, 8], s: [3, 5], tags: ["landscape"], note: "Color foliage accent; protect from frost in north FL." },
  { id: "plumbago", name: "Plumbago", sci: "Plumbago auriculata", cat: "Native Shrub", layer: "Shrub", zones: ["9a", "9b", "10a", "10b"], eat: false, h: [3, 6], s: [4, 6], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor"] },
  { id: "firespike", name: "Firespike", sci: "Odontonema cuspidatum", cat: "Native Shrub", layer: "Shrub", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [4, 8], s: [3, 5], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"] },
  { id: "simpson-stopper", name: "Simpson's Stopper", sci: "Myrcianthes fragrans", cat: "Native Shrub", layer: "Shrub", zones: ["9a", "9b", "10a", "10b"], nat: true, eat: false, h: [8, 20], s: [6, 10], tags: ["native", "landscape"], guild: ["Wildlife Habitat", "Pollinator Attractor"], note: "Native screen shrub; berries for birds." },
  { id: "walters-viburnum", name: "Walter's Viburnum", sci: "Viburnum obovatum", cat: "Native Shrub", layer: "Shrub", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [8, 15], s: [6, 10], tags: ["native", "landscape", "pollinator"], guild: ["Pollinator Attractor", "Wildlife Habitat"] },
  { id: "wax-myrtle", name: "Wax Myrtle", sci: "Morella cerifera", cat: "Native Shrub", layer: "Shrub", zones: ["8a", "8b", "9a", "9b", "10a"], nat: true, eat: false, h: [10, 20], s: [8, 12], tags: ["native", "landscape"], guild: ["Wildlife Habitat", "Wind Break"] },
  { id: "yaupon-holly", name: "Yaupon Holly", sci: "Ilex vomitoria", cat: "Native Shrub", layer: "Shrub", zones: ["8a", "8b", "9a", "9b", "10a"], nat: true, eat: false, h: [10, 25], s: [8, 12], tags: ["native", "landscape"], guild: ["Wildlife Habitat"] },
  { id: "dwarf-walter-viburnum", name: "Dwarf Walter's Viburnum", sci: "Viburnum obovatum 'Densa'", cat: "Native Shrub", layer: "Shrub", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [4, 6], s: [4, 6], tags: ["native", "landscape"] },
  { id: "coral-honeysuckle", name: "Coral Honeysuckle", sci: "Lonicera sempervirens", cat: "Vine", layer: "Vine", zones: ["8b", "9a", "9b", "10a"], nat: true, h: [8, 15], s: [3, 5], tags: ["native", "pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"] },
  { id: "confederate-jasmine", name: "Confederate Jasmine", sci: "Trachelospermum jasminoides", cat: "Vine", layer: "Vine", zones: ["8b", "9a", "9b", "10a"], eat: false, h: [10, 20], s: [4, 8], tags: ["landscape", "pollinator"], guild: ["Pollinator Attractor"] },
  { id: "mandevilla", name: "Mandevilla", sci: "Mandevilla spp.", cat: "Vine", layer: "Vine", zones: ["10a", "10b", "11a"], eat: false, h: [6, 10], s: [3, 5], tags: ["pollinator", "landscape"] },
  { id: "allamanda", name: "Allamanda", sci: "Allamanda cathartica", cat: "Vine", layer: "Vine", zones: ["10a", "10b", "11a"], eat: false, h: [8, 12], s: [4, 6], tags: ["landscape", "pollinator"] },
  { id: "gardenia-veitchii", name: "Gardenia (Veitchii)", sci: "Gardenia jasminoides", cat: "Native Shrub", layer: "Shrub", zones: ["9a", "9b", "10a"], eat: false, h: [3, 5], s: [3, 4], tags: ["landscape", "pollinator"], guild: ["Pollinator Attractor"] },
  { id: "jatropha", name: "Jatropha", sci: "Jatropha integerrima", cat: "Native Shrub", layer: "Shrub", zones: ["10a", "10b", "11a"], eat: false, h: [4, 6], s: [4, 6], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"] },
  { id: "thryallis", name: "Thryallis", sci: "Galphimia gracilis", cat: "Native Shrub", layer: "Shrub", zones: ["9b", "10a", "10b"], eat: false, h: [4, 6], s: [3, 5], tags: ["landscape", "pollinator"] },
  { id: "golden-dewdrop", name: "Golden Dewdrop", sci: "Duranta erecta", cat: "Native Shrub", layer: "Shrub", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [6, 12], s: [4, 8], tags: ["landscape", "pollinator"], guild: ["Pollinator Attractor", "Wildlife Habitat"], note: "Can spread; avoid planting near sensitive wetlands." },
]);

const LANDSCAPE_TREES_PALMS = compactSeeds([
  { id: "queen-palm", name: "Queen Palm", sci: "Syagrus romanzoffiana", cat: "Palm", layer: "Overstory", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [30, 50], s: [10, 15], tags: ["landscape"] },
  { id: "royal-palm", name: "Royal Palm", sci: "Roystonea regia", cat: "Palm", layer: "Overstory", zones: ["10a", "10b", "11a"], eat: false, h: [50, 80], s: [15, 20], tags: ["landscape"] },
  { id: "foxtail-palm", name: "Foxtail Palm", sci: "Wodyetia bifurcata", cat: "Palm", layer: "Overstory", zones: ["10a", "10b", "11a"], eat: false, h: [25, 35], s: [10, 15], tags: ["landscape"] },
  { id: "coconut-palm", name: "Coconut Palm", sci: "Cocos nucifera", cat: "Palm", layer: "Overstory", zones: ["10b", "11a"], eat: true, k: true, h: [40, 80], s: [15, 25], tags: ["landscape"], note: "Coastal south Florida; salt-tolerant." },
  { id: "live-oak", name: "Live Oak", sci: "Quercus virginiana", cat: "Fruit Tree", layer: "Overstory", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [40, 80], s: [40, 80], tags: ["native", "landscape"], guild: ["Wildlife Habitat", "Wind Break"], note: "Iconic Florida shade tree; acorns for wildlife." },
  { id: "red-maple", name: "Red Maple", sci: "Acer rubrum", cat: "Fruit Tree", layer: "Overstory", zones: ["8a", "8b", "9a"], nat: true, eat: false, h: [40, 60], s: [25, 35], tags: ["native", "landscape"], guild: ["Wildlife Habitat"] },
  { id: "southern-magnolia", name: "Southern Magnolia", sci: "Magnolia grandiflora", cat: "Fruit Tree", layer: "Overstory", zones: ["8a", "8b", "9a", "9b"], nat: true, eat: false, h: [40, 80], s: [20, 40], tags: ["native", "landscape"], guild: ["Wildlife Habitat"] },
  { id: "crape-myrtle", name: "Crape Myrtle", sci: "Lagerstroemia indica", cat: "Native Shrub", layer: "Understory", zones: ["8b", "9a", "9b", "10a"], eat: false, h: [15, 25], s: [10, 15], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor"] },
  { id: "tabebuia-yellow", name: "Yellow Tabebuia", sci: "Handroanthus chrysanthus", cat: "Native Shrub", layer: "Overstory", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [20, 35], s: [15, 25], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor"] },
  { id: "jacaranda", name: "Jacaranda", sci: "Jacaranda mimosifolia", cat: "Native Shrub", layer: "Overstory", zones: ["10a", "10b", "11a"], eat: false, h: [25, 40], s: [20, 30], tags: ["landscape", "pollinator"], guild: ["Pollinator Attractor"] },
]);

const GROUNDCOVERS_TURF = compactSeeds([
  { id: "muhly-grass", name: "Muhly Grass", sci: "Muhlenbergia capillaris", cat: "Ground Cover", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [2, 3], s: [2, 3], tags: ["native", "landscape"], guild: ["Wildlife Habitat"], note: "UF/IFAS native ornamental grass; pink fall plumes." },
  { id: "fakahatchee-grass", name: "Fakahatchee Grass", sci: "Tripsacum dactyloides", cat: "Ground Cover", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [4, 6], s: [4, 6], tags: ["native", "landscape"], guild: ["Wildlife Habitat"] },
  { id: "asian-jasmine", name: "Asian Jasmine", sci: "Trachelospermum asiaticum", cat: "Ground Cover", layer: "Groundcover", zones: ["8b", "9a", "9b", "10a"], eat: false, h: [0.5, 1], s: [3, 6], tags: ["landscape"], note: "Low-maintenance groundcover for sun or shade." },
  { id: "perennial-peanut", name: "Perennial Peanut", sci: "Arachis glabrata", cat: "Ground Cover", layer: "Groundcover", zones: ["9a", "9b", "10a", "10b"], eat: false, h: [0.25, 0.5], s: [2, 4], tags: ["landscape", "pollinator"], guild: ["Nitrogen Fixer", "Pollinator Attractor"], note: "UF/IFAS lawn alternative; no mowing once established." },
  { id: "sunshine-mimosa", name: "Sunshine Mimosa", sci: "Mimosa strigillosa", cat: "Ground Cover", layer: "Groundcover", zones: ["9a", "9b", "10a", "10b"], nat: true, eat: false, h: [0.25, 0.5], s: [2, 4], tags: ["native", "landscape"], guild: ["Nitrogen Fixer", "Pollinator Attractor"], note: "Native lawn alternative; sensitive to foot traffic." },
  { id: "bahia-grass", name: "Bahiagrass", sci: "Paspalum notatum", cat: "Ground Cover", layer: "Groundcover", zones: ["8b", "9a", "9b", "10a"], eat: false, h: [1, 2], s: [4, 8], tags: ["landscape"], note: "UF/IFAS low-input turf for full sun." },
  { id: "st-augustine-grass", name: "St. Augustinegrass", sci: "Stenotaphrum secundatum", cat: "Ground Cover", layer: "Groundcover", zones: ["8b", "9a", "9b", "10a", "10b"], eat: false, h: [0.5, 1], s: [4, 8], tags: ["landscape"], note: "Most common Florida lawn grass; moderate water." },
  { id: "buffalograss", name: "Buffalograss", sci: "Bouteloua dactyloides", cat: "Ground Cover", layer: "Groundcover", zones: ["8b", "9a"], eat: false, h: [0.5, 1], s: [3, 6], tags: ["landscape"], note: "Low-water turf option for north FL." },
  { id: "beach-sunflower", name: "Beach Sunflower", sci: "Helianthus debilis", cat: "Edible Flower", layer: "Groundcover", zones: ["9a", "9b", "10a", "10b"], nat: true, h: [1, 2], s: [3, 6], tags: ["native", "pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"] },
  { id: "frogfruit", name: "Frogfruit", sci: "Phyla nodiflora", cat: "Ground Cover", layer: "Groundcover", zones: ["8b", "9a", "9b", "10a"], nat: true, eat: false, h: [0.25, 0.5], s: [2, 4], tags: ["native", "pollinator", "landscape"], guild: ["Pollinator Attractor", "Wildlife Habitat"], note: "Native groundcover; butterfly host." },
]);

const EXTRA_VEGETABLES = compactSeeds([
  { id: "kohlrabi", name: "Kohlrabi", sci: "Brassica oleracea var. gongylodes", cat: "Vegetable", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], k: true, h: [1, 1.5], s: [1, 2], note: "Cool-season in Florida." },
  { id: "rutabaga", name: "Rutabaga", sci: "Brassica napus", cat: "Vegetable", layer: "Root", zones: ["8b", "9a", "9b", "10a"], k: true, h: [1, 1.5], s: [0.5, 1], note: "Fall/winter root crop." },
  { id: "leek", name: "Leek", sci: "Allium ampeloprasum", cat: "Vegetable", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], k: true, h: [1, 2], s: [0.5, 1] },
  { id: "shallot", name: "Shallot", sci: "Allium cepa var. aggregatum", cat: "Vegetable", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], k: true, h: [1, 1.5], s: [0.5, 1] },
  { id: "potato-sweet-beauregard", name: "Beauregard Sweet Potato", sci: "Ipomoea batatas", cat: "Vegetable", layer: "Groundcover", zones: ["8b", "9a", "9b", "10a", "10b"], k: true, h: [1, 1.5], s: [3, 5], note: "UF/IFAS staple; slips in spring." },
  { id: "taro-edible", name: "Taro (Dasheen)", sci: "Colocasia esculenta", cat: "Vegetable", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], k: true, h: [3, 5], s: [3, 5], water: "High", note: "Edible corms; moist soil." },
  { id: "chaya", name: "Chaya (Tree Spinach)", sci: "Cnidoscolus aconitifolius", cat: "Vegetable", layer: "Shrub", zones: ["10a", "10b", "11a"], k: true, h: [6, 12], s: [4, 6], note: "Cook leaves before eating; perennial greens." },
  { id: "culantro", name: "Culantro", sci: "Eryngium foetidum", cat: "Herb", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], k: true, h: [1, 2], s: [1, 2], sun: "Partial Shade", note: "Heat-tolerant cilantro substitute." },
  { id: "katuk", name: "Katuk (Sweet Leaf Bush)", sci: "Sauropus androgynus", cat: "Vegetable", layer: "Shrub", zones: ["10a", "10b", "11a"], k: true, h: [4, 8], s: [3, 5], sun: "Partial Shade", note: "Perennial leafy green for south FL." },
  { id: "cranberry-hibiscus-ornamental", name: "Red Leaf Hibiscus", sci: "Hibiscus acetosella", cat: "Edible Flower", layer: "Shrub", zones: ["9b", "10a", "10b", "11a"], k: true, h: [4, 6], s: [3, 4], tags: ["pollinator"], guild: ["Pollinator Attractor", "Food Producer"] },
  { id: "sweet-corn-silver-queen", name: "Silver Queen Sweet Corn", sci: "Zea mays", cat: "Vegetable", layer: "Herbaceous", zones: ["8b", "9a", "9b", "10a"], k: true, h: [6, 8], s: [1, 2] },
  { id: "pumpkin-jack-be-little", name: "Jack Be Little Pumpkin", sci: "Cucurbita pepo", cat: "Vegetable", layer: "Vine", zones: ["9a", "9b", "10a"], k: true, h: [1, 2], s: [4, 8] },
  { id: "winter-squash-butternut", name: "Butternut Winter Squash", sci: "Cucurbita moschata", cat: "Vegetable", layer: "Vine", zones: ["9a", "9b", "10a"], k: true, h: [1, 2], s: [4, 8] },
  { id: "watermelon-crimson-sweet", name: "Crimson Sweet Watermelon", sci: "Citrullus lanatus", cat: "Vegetable", layer: "Groundcover", zones: ["9a", "9b", "10a"], k: true, h: [1, 1.5], s: [6, 10] },
]);

const EXTRA_ANNUALS = compactSeeds([
  { id: "impatiens", name: "Impatiens", sci: "Impatiens walleriana", cat: "Edible Flower", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [0.5, 1], s: [1, 1.5], tags: ["landscape", "pollinator"], guild: ["Pollinator Attractor"] },
  { id: "petunia", name: "Petunia", sci: "Petunia × hybrida", cat: "Edible Flower", layer: "Herbaceous", zones: ["9a", "9b", "10a", "10b"], eat: false, h: [0.5, 1], s: [1, 2], tags: ["landscape", "pollinator"] },
  { id: "geranium", name: "Geranium", sci: "Pelargonium × hortorum", cat: "Edible Flower", layer: "Herbaceous", zones: ["9a", "9b", "10a"], eat: false, h: [1, 2], s: [1, 2], tags: ["landscape"] },
  { id: "salvia-red", name: "Red Salvia", sci: "Salvia splendens", cat: "Edible Flower", layer: "Herbaceous", zones: ["9a", "9b", "10a", "10b"], eat: false, h: [1, 2], s: [1, 2], tags: ["pollinator", "landscape"], guild: ["Pollinator Attractor"] },
  { id: "vinca", name: "Vinca (Periwinkle)", sci: "Catharanthus roseus", cat: "Edible Flower", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [0.5, 1], s: [1, 2], tags: ["landscape", "pollinator"] },
  { id: "coleus", name: "Coleus", sci: "Plectranthus scutellarioides", cat: "Edible Flower", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [1, 2], s: [1, 2], tags: ["landscape"] },
  { id: "caladium", name: "Caladium", sci: "Caladium bicolor", cat: "Edible Flower", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [1, 2], s: [1, 2], tags: ["landscape"], sun: "Partial Shade" },
  { id: "begonia-wax", name: "Wax Begonia", sci: "Begonia × semperflorens-cultorum", cat: "Edible Flower", layer: "Herbaceous", zones: ["9b", "10a", "10b", "11a"], eat: false, h: [0.5, 1], s: [1, 1.5], tags: ["landscape"] },
]);

export const FL_FLORIDA_GARDEN_PLANTS = [
  ...LANDSCAPE_SHRUBS,
  ...LANDSCAPE_TREES_PALMS,
  ...GROUNDCOVERS_TURF,
  ...EXTRA_VEGETABLES,
  ...EXTRA_ANNUALS,
];
