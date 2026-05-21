/**
 * Tennessee food-forest catalog — fruit trees, berries, herbs, shrubs, natives.
 * Zones 6a–8a; UT Extension, TN native plant guides, and permaculture lists.
 */
import type { Plant } from "../schema.js";
import { compactStateSeeds } from "./seed-helpers.js";

const TN = "TN";

export const TN_FOOD_FOREST_PLANTS: Plant[] = compactStateSeeds(
  [
    // —— Fruit & nut trees ——
    { id: "tn-apple-liberty", name: "Liberty Apple", sci: "Malus domestica", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a", "7b"], k: true, h: [12, 18], s: [10, 14] },
    { id: "tn-apple-gala", name: "Gala Apple", sci: "Malus domestica", cat: "Fruit Tree", layer: "Overstory", zones: ["6b", "7a", "7b"], k: true, h: [12, 18], s: [10, 14] },
    { id: "tn-peach-redhaven", name: "Redhaven Peach", sci: "Prunus persica", cat: "Fruit Tree", layer: "Overstory", zones: ["6b", "7a", "7b", "8a"], k: true, h: [12, 20], s: [10, 15] },
    { id: "tn-cherry-stella", name: "Stella Sweet Cherry", sci: "Prunus avium", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a"], h: [15, 25], s: [12, 18] },
    { id: "tn-plum-methley", name: "Methley Plum", sci: "Prunus salicina", cat: "Fruit Tree", layer: "Overstory", zones: ["6b", "7a", "7b"], k: true, h: [12, 18], s: [10, 14] },
    { id: "tn-pear-moonglow", name: "Moonglow Pear", sci: "Pyrus communis", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a"], k: true, h: [15, 22], s: [10, 15] },
    { id: "tn-pawpaw", name: "Pawpaw", sci: "Asimina triloba", cat: "Fruit Tree", layer: "Understory", zones: ["6a", "6b", "7a", "7b"], k: true, nat: true, h: [15, 25], s: [10, 15], note: "TN native understory fruit; shade-tolerant." },
    { id: "tn-persimmon-american", name: "American Persimmon", sci: "Diospyros virginiana", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a", "7b", "8a"], k: true, nat: true, h: [35, 60], s: [20, 30] },
    { id: "tn-fig-brown-turkey", name: "Brown Turkey Fig", sci: "Ficus carica", cat: "Fruit Tree", layer: "Shrub", zones: ["7a", "7b", "8a"], k: true, h: [10, 15], s: [8, 12], note: "Best in west TN and protected sites." },
    { id: "tn-pomegranate", name: "Pomegranate", sci: "Punica granatum", cat: "Fruit Tree", layer: "Shrub", zones: ["7a", "7b", "8a"], h: [8, 12], s: [6, 10] },
    { id: "tn-pecan", name: "Pecan", sci: "Carya illinoinensis", cat: "Fruit Tree", layer: "Overstory", zones: ["6b", "7a", "7b", "8a"], k: true, h: [50, 80], s: [30, 50] },
    { id: "tn-hazelnut", name: "American Hazelnut", sci: "Corylus americana", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], nat: true, k: true, h: [8, 12], s: [6, 10] },
    { id: "tn-black-walnut", name: "Black Walnut", sci: "Juglans nigra", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a", "7b"], nat: true, h: [50, 75], s: [30, 45], note: "Allelopathic — plan guild spacing." },

    // —— Berries & vines ——
    { id: "tn-blueberry-highbush", name: "Highbush Blueberry", sci: "Vaccinium corymbosum", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], k: true, nat: true, h: [5, 8], s: [4, 6], sun: "Full Sun" },
    { id: "tn-raspberry-heritage", name: "Heritage Raspberry", sci: "Rubus idaeus", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], k: true, h: [4, 6], s: [3, 5] },
    { id: "tn-blackberry-navaho", name: "Navaho Thornless Blackberry", sci: "Rubus fruticosus", cat: "Berry", layer: "Shrub", zones: ["6b", "7a", "7b", "8a"], k: true, h: [4, 6], s: [3, 5] },
    { id: "tn-elderberry", name: "American Elderberry", sci: "Sambucus canadensis", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a", "7b"], k: true, nat: true, h: [8, 12], s: [6, 10] },
    { id: "tn-gooseberry", name: "Gooseberry", sci: "Ribes uva-crispa", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], h: [3, 5], s: [3, 4] },
    { id: "tn-grape-muscadine", name: "Muscadine Grape", sci: "Vitis rotundifolia", cat: "Vine", layer: "Vine", zones: ["7a", "7b", "8a"], k: true, nat: true, h: [15, 25], s: [8, 12] },
    { id: "tn-grape-concord", name: "Concord Grape", sci: "Vitis labrusca", cat: "Vine", layer: "Vine", zones: ["6a", "6b", "7a"], k: true, h: [15, 20], s: [8, 12] },
    { id: "tn-kiwi-hardy", name: "Hardy Kiwi", sci: "Actinidia arguta", cat: "Vine", layer: "Vine", zones: ["6a", "6b", "7a"], h: [15, 20], s: [8, 12] },
    { id: "tn-serviceberry", name: "Serviceberry", sci: "Amelanchier arborea", cat: "Berry", layer: "Understory", zones: ["6a", "6b", "7a"], nat: true, k: true, h: [15, 25], s: [10, 15] },
    { id: "tn-aronia", name: "Aronia (Chokeberry)", sci: "Aronia melanocarpa", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], k: true, h: [5, 8], s: [4, 6] },

    // —— Herbs & vegetables ——
    { id: "tn-basil", name: "Sweet Basil", sci: "Ocimum basilicum", cat: "Herb", layer: "Herbaceous", zones: ["6b", "7a", "7b", "8a"], k: true, h: [1, 2], s: [1, 2] },
    { id: "tn-thyme", name: "Creeping Thyme", sci: "Thymus serpyllum", cat: "Herb", layer: "Groundcover", zones: ["6a", "6b", "7a", "7b"], k: true, h: [0.5, 0.5], s: [1, 2] },
    { id: "tn-oregano", name: "Greek Oregano", sci: "Origanum vulgare", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [1, 2], s: [1, 2] },
    { id: "tn-sage", name: "Garden Sage", sci: "Salvia officinalis", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [2, 3], s: [2, 3] },
    { id: "tn-rosemary", name: "Rosemary", sci: "Salvia rosmarinus", cat: "Herb", layer: "Shrub", zones: ["7a", "7b", "8a"], k: true, h: [3, 5], s: [3, 4], note: "West TN / protected microclimates." },
    { id: "tn-echinacea", name: "Purple Coneflower", sci: "Echinacea purpurea", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [3, 4], s: [2, 3], tags: ["pollinator", "medicinal"] },
    { id: "tn-comfrey", name: "Comfrey", sci: "Symphytum officinale", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], h: [2, 3], s: [2, 3], guild: ["Dynamic Accumulator", "Pollinator Attractor"] },
    { id: "tn-asparagus", name: "Asparagus", sci: "Asparagus officinalis", cat: "Vegetable", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [4, 5], s: [3, 4] },
    { id: "tn-rhubarb", name: "Rhubarb", sci: "Rheum rhabarbarum", cat: "Vegetable", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [2, 3], s: [3, 4] },
    { id: "tn-tomato", name: "Heirloom Tomato", sci: "Solanum lycopersicum", cat: "Vegetable", layer: "Herbaceous", zones: ["6b", "7a", "7b", "8a"], k: true, h: [4, 6], s: [2, 3] },

    // —— Native shrubs, flowers & support ——
    { id: "tn-beautyberry", name: "American Beautyberry", sci: "Callicarpa americana", cat: "Native Shrub", layer: "Shrub", zones: ["7a", "7b", "8a"], nat: true, h: [4, 6], s: [4, 6], tags: ["pollinator", "wildlife"] },
    { id: "tn-sumac", name: "Staghorn Sumac", sci: "Rhus typhina", cat: "Native Shrub", layer: "Shrub", zones: ["6a", "6b", "7a"], nat: true, h: [15, 25], s: [15, 20], tags: ["pollinator"] },
    { id: "tn-redbud", name: "Eastern Redbud", sci: "Cercis canadensis", cat: "Native Shrub", layer: "Understory", zones: ["6a", "6b", "7a", "7b"], nat: true, h: [20, 30], s: [20, 25], tags: ["pollinator", "nitrogen"] },
    { id: "tn-dogwood", name: "Flowering Dogwood", sci: "Cornus florida", cat: "Native Shrub", layer: "Understory", zones: ["6a", "6b", "7a"], nat: true, h: [15, 25], s: [15, 20], tags: ["pollinator"] },
    { id: "tn-milkweed", name: "Common Milkweed", sci: "Asclepias syriaca", cat: "Native Shrub", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [3, 5], s: [2, 3], tags: ["pollinator"] },
    { id: "tn-butterfly-weed", name: "Butterfly Weed", sci: "Asclepias tuberosa", cat: "Native Shrub", layer: "Herbaceous", zones: ["6a", "6b", "7a", "7b"], nat: true, h: [2, 3], s: [2, 3], tags: ["pollinator"] },
    { id: "tn-aster", name: "New England Aster", sci: "Symphyotrichum novae-angliae", cat: "Edible Flower", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [4, 6], s: [3, 4], tags: ["pollinator"] },
    { id: "tn-goldenrod", name: "Goldenrod", sci: "Solidago canadensis", cat: "Native Shrub", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [3, 5], s: [2, 3], tags: ["pollinator"] },
    { id: "tn-wild-bergamot", name: "Wild Bergamot", sci: "Monarda fistulosa", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [2, 4], s: [2, 3], tags: ["pollinator", "medicinal"] },
    { id: "tn-black-eyed-susan", name: "Black-eyed Susan", sci: "Rudbeckia hirta", cat: "Edible Flower", layer: "Herbaceous", zones: ["6a", "6b", "7a", "7b"], nat: true, h: [2, 3], s: [2, 3], tags: ["pollinator"] },
    { id: "tn-clover-white", name: "White Clover", sci: "Trifolium repens", cat: "Ground Cover", layer: "Groundcover", zones: ["6a", "6b", "7a", "7b"], h: [0.5, 0.5], s: [1, 2], guild: ["Nitrogen Fixer", "Pollinator Attractor"] },
    { id: "tn-comfrey-dynamic", name: "Comfrey (Bocking)", sci: "Symphytum × uplandicum", cat: "Support Species", layer: "Herbaceous", zones: ["6a", "6b", "7a"], h: [3, 4], s: [2, 3], guild: ["Dynamic Accumulator"] },
    { id: "tn-goumi", name: "Goumi Berry", sci: "Elaeagnus multiflora", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], k: true, h: [6, 10], s: [5, 8], guild: ["Nitrogen Fixer", "Food Producer"] },
    { id: "tn-sea-buckthorn", name: "Sea Buckthorn", sci: "Hippophae rhamnoides", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], h: [8, 12], s: [6, 8] },
    { id: "tn-nasturtium", name: "Nasturtium", sci: "Tropaeolum majus", cat: "Edible Flower", layer: "Herbaceous", zones: ["6b", "7a", "7b", "8a"], k: true, h: [1, 1], s: [1, 2], tags: ["pollinator"] },
    { id: "tn-sunflower", name: "Sunflower", sci: "Helianthus annuus", cat: "Edible Flower", layer: "Herbaceous", zones: ["6b", "7a", "7b", "8a"], k: true, h: [6, 10], s: [2, 3], tags: ["pollinator"] },
    { id: "tn-mulberry", name: "Red Mulberry", sci: "Morus rubra", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a", "7b"], nat: true, k: true, h: [35, 50], s: [25, 35] },
    { id: "tn-juneberry", name: "Juneberry (Allegheny)", sci: "Amelanchier laevis", cat: "Berry", layer: "Understory", zones: ["6a", "6b", "7a"], nat: true, k: true, h: [15, 25], s: [10, 15] },
  ],
  TN,
);
