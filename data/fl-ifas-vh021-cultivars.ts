/**
 * Tomato, pepper, and squash cultivars from UF/IFAS Florida Vegetable Gardening
 * Guide (SP 103 / VH021) — https://edis.ifas.ufl.edu/publication/VH021
 *
 * Only varieties named in that publication are included. Do not add cultivars here
 * without a VH021 listing.
 */
import { compactSeeds, type CompactSeed } from "./seed-helpers.js";

const VH021 = "UF/IFAS Florida Vegetable Gardening Guide (SP 103/VH021)";

function tomato(
  cultivar: string,
  group: "large" | "small" | "heirloom",
  extra?: Partial<CompactSeed>,
): CompactSeed {
  const tswv = cultivar.includes("*");
  const clean = cultivar.replace(/\*$/, "").trim();
  return {
    id: `tomato-${slug(clean)}`,
    name: `${clean} Tomato`,
    sci: "Solanum lycopersicum",
    cat: "Vegetable",
    layer: "Herbaceous",
    zones: ["8b", "9a", "9b", "10a", "10b"],
    k: true,
    h: group === "small" ? [3, 5] : [4, 6],
    s: group === "small" ? [2, 3] : [2, 4],
    note: `${VH021} (${group} fruit).${tswv ? " TSWV-resistant per VH021." : ""}`,
    tags: ["food-forest", "florida", "ifas", "tomato"],
    ...extra,
  };
}

function pepper(
  cultivar: string,
  kind: "sweet" | "hot",
  sci: "Capsicum annuum" | "Capsicum chinense" = "Capsicum annuum",
): CompactSeed {
  return {
    id: `pepper-${slug(cultivar)}`,
    name: `${cultivar} Pepper`,
    sci,
    cat: "Vegetable",
    layer: "Herbaceous",
    zones: ["9a", "9b", "10a", "10b", "11a"],
    k: true,
    h: kind === "hot" ? [2, 4] : [2, 3],
    s: [1.5, 2.5],
    note: `${VH021} (${kind} pepper).`,
    tags: ["food-forest", "florida", "ifas", "pepper"],
  };
}

function squash(
  cultivar: string,
  group: "summer" | "zucchini" | "winter" | "tropical",
  sci: string,
  layer: "Groundcover" | "Vine" = "Groundcover",
  extra?: Partial<CompactSeed>,
): CompactSeed {
  return {
    id: extra?.id ?? `squash-${slug(cultivar)}`,
    name:
      group === "tropical" ? `${cultivar} (Tropical Pumpkin)` : `${cultivar} Squash`,
    sci,
    cat: "Vegetable",
    layer,
    zones: ["9a", "9b", "10a", "10b", "11a"],
    k: true,
    h: layer === "Vine" ? [8, 15] : [1, 2],
    s: [6, 12],
    note: `${VH021} (${group} squash).`,
    tags: ["food-forest", "florida", "ifas", "squash"],
    ...extra,
  };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/™/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** VH021 — Tomatoes (supported) */
const TOMATO_LARGE = [
  "Celebrity",
  "Heat Wave II",
  "Better Boy",
  "Better Bush",
  "Beefmaster",
  "BHN444-Southern Star",
  "Amelia",
  "BHN 640",
  "Tasti-Lee",
  "BHN 685",
  "BHN 602",
  "Bella Rosa",
  "Quincy",
  "Volante",
] as const;

const TOMATO_SMALL = [
  "Sweet 100",
  "Juliet",
  "Red Grape",
  "Sun Gold",
  "Sugar Snack",
  "Sweet Baby Girl",
] as const;

const TOMATO_HEIRLOOM = [
  "Green Zebra",
  "Cherokee Purple",
  "Eva Purple Ball",
  "Brandywine",
  "Mortgage Lifter",
  "Delicious",
] as const;

/** VH021 — Peppers */
const PEPPER_SWEET = [
  "California Wonder",
  "Red Knight",
  "Big Bertha",
  "Sweet Banana",
  "Giant Marconi",
  "Cubanelle",
] as const;

const PEPPER_HOT = [
  "Early Jalapeno",
  "Jalapeno M",
  "Cherry Bomb",
  "Hungarian Hot Wax",
  "Big Chile II",
  "Mariachi",
  "Numex",
  "Ancho",
  "Thai",
  "Anaheim Chile",
  "Long Cayenne",
  "Habanero",
  "Caribbean Red Habanero",
] as const;

/** VH021 — Squash section + tropical pumpkins listed with squash/pumpkin */
const SQUASH_SUMMER = [
  "Early Prolific Straightneck",
  "Summer Crookneck",
  "Early White Scallop",
] as const;

const SQUASH_ZUCCHINI = [
  "Cocozelle",
  "Spineless Beauty",
  "Black Beauty",
] as const;

const SQUASH_WINTER = [
  "Spaghetti",
  "Table King",
  "Table Queen",
  "Table Ace",
  "Waltham",
  "Early Butternut",
] as const;

/** VH021 — Chayote (squash section); Calabaza (zucchini); tropical pumpkins */
const SQUASH_CHAYOTE = squash("Chayote", "summer", "Sechium edule", "Vine");
const SQUASH_CALABAZA = squash("Calabaza", "zucchini", "Cucurbita moschata");
const SQUASH_SEMINOLE = squash("Seminole", "tropical", "Cucurbita moschata", "Groundcover", {
  id: "seminole-pumpkin",
  name: "Seminole Pumpkin",
  nat: true,
  note: `${VH021} (tropical pumpkin). Florida heritage cultivar.`,
});
const SQUASH_MORANGA = squash("Moranga", "tropical", "Cucurbita maxima");

const VH021_CULTIVARS: CompactSeed[] = [
  ...TOMATO_LARGE.map((c) => tomato(c, "large")),
  ...TOMATO_SMALL.map((c) => tomato(c, "small")),
  ...TOMATO_HEIRLOOM.map((c) => tomato(c, "heirloom")),
  ...PEPPER_SWEET.map((c) => pepper(c, "sweet")),
  ...PEPPER_HOT.map((c) =>
    pepper(
      c,
      "hot",
      c === "Habanero" || c === "Caribbean Red Habanero"
        ? "Capsicum chinense"
        : "Capsicum annuum",
    ),
  ),
  ...SQUASH_SUMMER.map((c) => squash(c, "summer", "Cucurbita pepo")),
  ...SQUASH_ZUCCHINI.map((c) => squash(c, "zucchini", "Cucurbita pepo")),
  ...SQUASH_WINTER.map((c) =>
    squash(
      c,
      "winter",
      c === "Waltham" || c === "Early Butternut"
        ? "Cucurbita moschata"
        : "Cucurbita pepo",
    ),
  ),
  SQUASH_CHAYOTE,
  SQUASH_CALABAZA,
  SQUASH_SEMINOLE,
  SQUASH_MORANGA,
];

export const FL_IFAS_VH021_CULTIVARS = compactSeeds(VH021_CULTIVARS);
