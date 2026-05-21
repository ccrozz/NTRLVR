/**
 * Connecticut food-forest catalog — cold-hardy fruit, berries, herbs, natives.
 * Zones 5b–7a; UConn Extension, CT native plant society lists.
 */
import type { Plant } from "../schema.js";
import { compactStateSeeds } from "./seed-helpers.js";

const CT = "CT";

export const CT_FOOD_FOREST_PLANTS: Plant[] = compactStateSeeds(
  [
    // —— Fruit & nut trees ——
    { id: "ct-apple-honeycrisp", name: "Honeycrisp Apple", sci: "Malus domestica", cat: "Fruit Tree", layer: "Overstory", zones: ["5b", "6a", "6b", "7a"], k: true, h: [12, 18], s: [10, 14] },
    { id: "ct-apple-granny", name: "Granny Smith Apple", sci: "Malus domestica", cat: "Fruit Tree", layer: "Overstory", zones: ["5b", "6a", "6b"], k: true, h: [12, 18], s: [10, 14] },
    { id: "ct-pear-bartlett", name: "Bartlett Pear", sci: "Pyrus communis", cat: "Fruit Tree", layer: "Overstory", zones: ["5b", "6a", "6b", "7a"], k: true, h: [15, 22], s: [10, 15] },
    { id: "ct-cherry-montmorency", name: "Montmorency Sour Cherry", sci: "Prunus cerasus", cat: "Fruit Tree", layer: "Overstory", zones: ["5b", "6a", "6b"], k: true, h: [12, 18], s: [10, 14] },
    { id: "ct-plum-santa-rosa", name: "Santa Rosa Plum", sci: "Prunus salicina", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a"], k: true, h: [12, 18], s: [10, 14] },
    { id: "ct-peach-reliance", name: "Reliance Peach", sci: "Prunus persica", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a"], k: true, h: [12, 18], s: [10, 14], note: "Cold-hardy; best on coast / protected sites." },
    { id: "ct-pawpaw", name: "Pawpaw", sci: "Asimina triloba", cat: "Fruit Tree", layer: "Understory", zones: ["6a", "6b", "7a"], k: true, nat: true, h: [15, 25], s: [10, 15], sun: "Partial Shade" },
    { id: "ct-persimmon", name: "American Persimmon", sci: "Diospyros virginiana", cat: "Fruit Tree", layer: "Overstory", zones: ["6a", "6b", "7a"], k: true, nat: true, h: [35, 60], s: [20, 30] },
    { id: "ct-hazelnut", name: "American Hazelnut", sci: "Corylus americana", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], nat: true, k: true, h: [8, 12], s: [6, 10] },
    { id: "ct-beach-plum", name: "Beach Plum", sci: "Prunus maritima", cat: "Fruit Tree", layer: "Shrub", zones: ["6a", "6b", "7a"], nat: true, k: true, h: [6, 10], s: [6, 8], note: "Coastal CT native." },

    // —— Berries & vines ——
    { id: "ct-blueberry-highbush", name: "Highbush Blueberry", sci: "Vaccinium corymbosum", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], k: true, nat: true, h: [5, 8], s: [4, 6] },
    { id: "ct-blueberry-low", name: "Lowbush Blueberry", sci: "Vaccinium angustifolium", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b"], k: true, nat: true, h: [1, 2], s: [2, 3] },
    { id: "ct-raspberry", name: "Heritage Raspberry", sci: "Rubus idaeus", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], k: true, h: [4, 6], s: [3, 5] },
    { id: "ct-blackberry", name: "Chester Thornless Blackberry", sci: "Rubus fruticosus", cat: "Berry", layer: "Shrub", zones: ["6a", "6b", "7a"], k: true, h: [4, 6], s: [3, 5] },
    { id: "ct-elderberry", name: "American Elderberry", sci: "Sambucus canadensis", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], k: true, nat: true, h: [8, 12], s: [6, 10] },
    { id: "ct-currant-red", name: "Red Currant", sci: "Ribes rubrum", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b"], k: true, h: [4, 5], s: [3, 4] },
    { id: "ct-gooseberry", name: "Gooseberry", sci: "Ribes uva-crispa", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b"], h: [3, 5], s: [3, 4] },
    { id: "ct-grape-concord", name: "Concord Grape", sci: "Vitis labrusca", cat: "Vine", layer: "Vine", zones: ["5b", "6a", "6b", "7a"], k: true, nat: true, h: [15, 20], s: [8, 12] },
    { id: "ct-kiwi-hardy", name: "Hardy Kiwi", sci: "Actinidia arguta", cat: "Vine", layer: "Vine", zones: ["6a", "6b", "7a"], h: [15, 20], s: [8, 12] },
    { id: "ct-aronia", name: "Aronia (Chokeberry)", sci: "Aronia melanocarpa", cat: "Berry", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], k: true, h: [5, 8], s: [4, 6] },

    // —— Herbs & vegetables ——
    { id: "ct-basil", name: "Sweet Basil", sci: "Ocimum basilicum", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [1, 2], s: [1, 2] },
    { id: "ct-thyme", name: "Creeping Thyme", sci: "Thymus serpyllum", cat: "Herb", layer: "Groundcover", zones: ["5b", "6a", "6b", "7a"], k: true, h: [0.5, 0.5], s: [1, 2] },
    { id: "ct-sage", name: "Garden Sage", sci: "Salvia officinalis", cat: "Herb", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], k: true, h: [2, 3], s: [2, 3] },
    { id: "ct-chives", name: "Chives", sci: "Allium schoenoprasum", cat: "Herb", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], k: true, h: [1, 1], s: [1, 2] },
    { id: "ct-lavender", name: "English Lavender", sci: "Lavandula angustifolia", cat: "Herb", layer: "Herbaceous", zones: ["6a", "6b", "7a"], h: [2, 3], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-echinacea", name: "Purple Coneflower", sci: "Echinacea purpurea", cat: "Herb", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], h: [3, 4], s: [2, 3], tags: ["pollinator", "medicinal"] },
    { id: "ct-asparagus", name: "Asparagus", sci: "Asparagus officinalis", cat: "Vegetable", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], k: true, h: [4, 5], s: [3, 4] },
    { id: "ct-rhubarb", name: "Rhubarb", sci: "Rheum rhabarbarum", cat: "Vegetable", layer: "Herbaceous", zones: ["5b", "6a", "6b"], k: true, h: [2, 3], s: [3, 4] },
    { id: "ct-kale", name: "Lacinato Kale", sci: "Brassica oleracea", cat: "Vegetable", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [2, 3], s: [2, 3] },
    { id: "ct-garlic", name: "Hardneck Garlic", sci: "Allium sativum", cat: "Vegetable", layer: "Herbaceous", zones: ["5b", "6a", "6b"], k: true, h: [1, 1], s: [0.5, 1] },

    // —— Native shrubs, flowers & support ——
    { id: "ct-redbud", name: "Eastern Redbud", sci: "Cercis canadensis", cat: "Native Shrub", layer: "Understory", zones: ["6a", "6b", "7a"], nat: true, h: [20, 30], s: [20, 25], tags: ["pollinator"] },
    { id: "ct-dogwood", name: "Flowering Dogwood", sci: "Cornus florida", cat: "Native Shrub", layer: "Understory", zones: ["6a", "6b", "7a"], nat: true, h: [15, 25], s: [15, 20], tags: ["pollinator"] },
    { id: "ct-viburnum", name: "Arrowwood Viburnum", sci: "Viburnum dentatum", cat: "Native Shrub", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [8, 12], s: [8, 10], tags: ["pollinator", "wildlife"] },
    { id: "ct-winterberry", name: "Winterberry Holly", sci: "Ilex verticillata", cat: "Native Shrub", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [8, 12], s: [8, 10], tags: ["wildlife"] },
    { id: "ct-spicebush", name: "Spicebush", sci: "Lindera benzoin", cat: "Native Shrub", layer: "Shrub", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [8, 12], s: [8, 10], tags: ["pollinator", "wildlife"] },
    { id: "ct-milkweed", name: "Common Milkweed", sci: "Asclepias syriaca", cat: "Native Shrub", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [3, 5], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-butterfly-weed", name: "Butterfly Weed", sci: "Asclepias tuberosa", cat: "Native Shrub", layer: "Herbaceous", zones: ["6a", "6b", "7a"], nat: true, h: [2, 3], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-aster", name: "New England Aster", sci: "Symphyotrichum novae-angliae", cat: "Edible Flower", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [4, 6], s: [3, 4], tags: ["pollinator"] },
    { id: "ct-goldenrod", name: "Goldenrod", sci: "Solidago canadensis", cat: "Native Shrub", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [3, 5], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-bee-balm", name: "Bee Balm", sci: "Monarda didyma", cat: "Herb", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [3, 4], s: [2, 3], tags: ["pollinator", "medicinal"] },
    { id: "ct-black-eyed-susan", name: "Black-eyed Susan", sci: "Rudbeckia hirta", cat: "Edible Flower", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], h: [2, 3], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-joe-pye", name: "Joe-Pye Weed", sci: "Eutrochium purpureum", cat: "Native Shrub", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], nat: true, h: [5, 7], s: [3, 4], tags: ["pollinator"] },
    { id: "ct-clover", name: "White Clover", sci: "Trifolium repens", cat: "Ground Cover", layer: "Groundcover", zones: ["5b", "6a", "6b", "7a"], h: [0.5, 0.5], s: [1, 2], guild: ["Nitrogen Fixer", "Pollinator Attractor"] },
    { id: "ct-comfrey", name: "Comfrey", sci: "Symphytum officinale", cat: "Support Species", layer: "Herbaceous", zones: ["5b", "6a", "6b", "7a"], h: [3, 4], s: [2, 3], guild: ["Dynamic Accumulator"] },
    { id: "ct-serviceberry", name: "Serviceberry", sci: "Amelanchier canadensis", cat: "Berry", layer: "Understory", zones: ["5b", "6a", "6b", "7a"], nat: true, k: true, h: [15, 25], s: [10, 15] },
    { id: "ct-cranberry", name: "American Cranberry", sci: "Vaccinium macrocarpon", cat: "Berry", layer: "Groundcover", zones: ["5b", "6a"], nat: true, k: true, h: [0.5, 0.5], s: [2, 3], note: "Boggy / acidic sites." },
    { id: "ct-nasturtium", name: "Nasturtium", sci: "Tropaeolum majus", cat: "Edible Flower", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [1, 1], s: [1, 2], tags: ["pollinator"] },
    { id: "ct-sunflower", name: "Sunflower", sci: "Helianthus annuus", cat: "Edible Flower", layer: "Herbaceous", zones: ["6a", "6b", "7a"], k: true, h: [6, 10], s: [2, 3], tags: ["pollinator"] },
    { id: "ct-beach-rose", name: "Rugosa Rose", sci: "Rosa rugosa", cat: "Native Shrub", layer: "Shrub", zones: ["6a", "6b", "7a"], h: [4, 6], s: [4, 6], tags: ["pollinator"], note: "Coastal hedgerow; edible hips." },
  ],
  CT,
);
