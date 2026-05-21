import type { CanopyLayer, GuildFunction, PlantCategory } from "../schema.js";
import type { CompanionReasonPlant } from "./companion-reason.js";
import { lookupCuratedPairNote } from "./companion-pair-notes.js";

const LAYER_PHRASE: Record<CanopyLayer, string> = {
  Overstory: "tall canopy",
  Understory: "mid-story",
  Shrub: "shrub layer",
  Herbaceous: "herbaceous layer",
  Groundcover: "ground-hugging cover",
  Root: "root-zone crop",
  Vine: "climbing vine",
};

const CATEGORY_PHRASE: Record<PlantCategory, string> = {
  "Fruit Tree": "fruit tree",
  Citrus: "citrus",
  "Tropical Fruit": "tropical fruit",
  Berry: "berry",
  Herb: "herb",
  Vegetable: "vegetable",
  "Ground Cover": "ground cover",
  "Support Species": "support plant",
  Vine: "vine",
  Palm: "palm",
  "Native Shrub": "native shrub",
  "Edible Flower": "flowering edible",
};

function hasFn(p: CompanionReasonPlant, fn: GuildFunction): boolean {
  return p.guild_functions.includes(fn);
}

function nameBlob(p: CompanionReasonPlant): string {
  return `${p.common_name} ${p.scientific_name} ${p.family ?? ""} ${p.genus ?? ""}`.toLowerCase();
}

function layerGap(a: CanopyLayer, b: CanopyLayer): number {
  const order: CanopyLayer[] = [
    "Overstory",
    "Understory",
    "Shrub",
    "Herbaceous",
    "Groundcover",
    "Root",
    "Vine",
  ];
  return Math.abs(order.indexOf(a) - order.indexOf(b));
}

function regionPhrase(host: CompanionReasonPlant): string {
  const states = host.native_states ?? [];
  if (states.includes("TN")) return "Tennessee";
  if (states.includes("CT")) return "Connecticut";
  if (states.includes("FL")) return "Florida";
  return "your climate";
}

function isLegume(p: CompanionReasonPlant): boolean {
  return (
    hasFn(p, "Nitrogen Fixer") ||
    /fabaceae|legumin|cajanus|leucaena|clover|pea|bean|moringa|pigeon/i.test(nameBlob(p))
  );
}

function isAccumulator(p: CompanionReasonPlant): boolean {
  return hasFn(p, "Dynamic Accumulator") || /comfrey|symphytum|yarrow|borage/i.test(nameBlob(p));
}

function isAromaticPestRepellent(p: CompanionReasonPlant): boolean {
  return (
    hasFn(p, "Pest Repellent") ||
    /lemongrass|cymbopogon|rosemary|salvia|lavender|basil|ocimum|mint|mentha|marigold|tagetes|nasturtium/i.test(
      nameBlob(p),
    )
  );
}

function isPollinatorPlant(p: CompanionReasonPlant): boolean {
  if (!hasFn(p, "Pollinator Attractor")) return false;
  if (hasFn(p, "Food Producer") && /fruit tree|citrus|berry|tropical fruit/i.test(p.category)) {
    return false;
  }
  return (
    p.category === "Herb" ||
    p.category === "Edible Flower" ||
    p.category === "Support Species" ||
    p.category === "Native Shrub" ||
    p.canopy_layer === "Herbaceous" ||
    p.canopy_layer === "Groundcover"
  );
}

function isFruitCrop(p: CompanionReasonPlant): boolean {
  return (
    hasFn(p, "Food Producer") ||
    /fruit tree|citrus|berry|tropical fruit/i.test(p.category)
  );
}

function pairHash(host: CompanionReasonPlant, comp: CompanionReasonPlant): number {
  const s = `${host.id ?? host.common_name}|${comp.id ?? comp.common_name}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type PairRule = {
  match: (host: CompanionReasonPlant, comp: CompanionReasonPlant) => boolean;
  build: (host: CompanionReasonPlant, comp: CompanionReasonPlant) => string;
};

const COMPANION_RULES: PairRule[] = [
  {
    match: (h, c) => /asimina|pawpaw/i.test(nameBlob(h)) && /ginger|asarum|wild ginger/i.test(nameBlob(c)),
    build: (h, c) =>
      `${c.common_name} spreads as a shady ground layer while ${h.common_name} carries the fruiting canopy above — both evolved for forest edges. Keep ginger shallow; pawpaw roots go deeper so they rarely clash.`,
  },
  {
    match: (h, c) => /asimina|pawpaw/i.test(nameBlob(h)) && isAccumulator(c),
    build: (h, c) =>
      `Pawpaw needs rich, moist, slightly acidic soil; ${c.common_name} supplies mineral-rich mulch from chop-and-drop leaves. Cut ${c.common_name} when it approaches the pawpaw trunk so shade stays dappled, not dense.`,
  },
  {
    match: (h, c) => isAccumulator(c) && isFruitCrop(h),
    build: (h, c) =>
      `${c.common_name}'s deep roots mine minerals your ${h.common_name} can't reach; chopped leaves break down into available potassium and calcium. Work ${c.common_name} in the ${LAYER_PHRASE[c.canopy_layer]} ring, not on top of the trunk.`,
  },
  {
    match: (h, c) => isAromaticPestRepellent(c) && isFruitCrop(h),
    build: (h, c) =>
      `${c.common_name} releases strong aromatics that confuse insects hunting ${h.common_name} leaves and fruit. Plant it on the sunny, open side of the bed so the ${CATEGORY_PHRASE[h.category]} crown still gets airflow.`,
  },
  {
    match: (h, c) => isLegume(c) && !isAccumulator(c) && isFruitCrop(h),
    build: (h, c) =>
      `${c.common_name} pulls nitrogen from the air into the soil where ${h.common_name} feeds heavily during flush growth. Coppice or mow ${c.common_name} in place — the leaf litter becomes free fertilizer at the ${LAYER_PHRASE[h.canopy_layer]} drip line.`,
  },
  {
    match: (h, c) => isPollinatorPlant(c) && isFruitCrop(h),
    build: (h, c) =>
      `${c.common_name} blooms when pollinators are active, drawing bees and beneficial wasps that also service ${h.common_name} flowers — often improving fruit set. Stagger bloom times by keeping ${c.common_name} in the ${LAYER_PHRASE[c.canopy_layer]}.`,
  },
  {
    match: (h, c) =>
      isFruitCrop(h) &&
      isFruitCrop(c) &&
      h.common_name.toLowerCase() !== c.common_name.toLowerCase(),
    build: (h, c) => {
      const gap = layerGap(h.canopy_layer, c.canopy_layer);
      if (gap >= 1) {
        return `${h.common_name} and ${c.common_name} stack as ${LAYER_PHRASE[h.canopy_layer]} plus ${LAYER_PHRASE[c.canopy_layer]} — different harvest heights, not the same niche. Space for mature spread so roots don't fight in the top 18 inches of soil.`;
      }
      return `${h.common_name} and ${c.common_name} both fruit — plant them far enough apart that canopies don't fuse, and accept that they may share pollinators but compete for sun. In ${regionPhrase(h)}, stagger ripening times to spread your workload.`;
    },
  },
  {
    match: (h, c) =>
      h.canopy_layer === "Overstory" &&
      (c.canopy_layer === "Understory" ||
        c.canopy_layer === "Shrub" ||
        c.canopy_layer === "Herbaceous"),
    build: (h, c) =>
      `${h.common_name} owns the ${LAYER_PHRASE[h.canopy_layer]}; ${c.common_name} harvests the filtered light underneath. That stack lets you grow two crops in one footprint — ${c.common_name} never needs the same full-sun slot as the canopy tree.`,
  },
  {
    match: (h, c) =>
      c.canopy_layer === "Overstory" &&
      (h.canopy_layer === "Understory" ||
        h.canopy_layer === "Shrub" ||
        h.canopy_layer === "Herbaceous"),
    build: (h, c) =>
      `${h.common_name} is your ${LAYER_PHRASE[h.canopy_layer]} crop; ${c.common_name} rises as ${LAYER_PHRASE[c.canopy_layer]} above it. Use this when you want long-term structure from ${c.common_name} while ${h.common_name} fills the shaded production zone.`,
  },
  {
    match: (h, c) =>
      (hasFn(c, "Groundcover/Mulch") || c.canopy_layer === "Groundcover") &&
      !isFruitCrop(c) &&
      layerGap(h.canopy_layer, c.canopy_layer) >= 1,
    build: (h, c) =>
      `${c.common_name} shields soil under ${h.common_name}, cutting evaporation in ${regionPhrase(h)} heat and smothering weeds that steal water. Living mulch keeps feeder roots cooler through summer without burying the trunk.`,
  },
  {
    match: (h, c) => hasFn(c, "Wind Break") && !isFruitCrop(c),
    build: (h, c) =>
      `${c.common_name} blocks drying wind before it hits ${h.common_name}, which matters in spring storms and exposed lots. Place ${c.common_name} on the prevailing-wind side as a living screen, not tight against the trunk.`,
  },
  {
    match: (h, c) => c.category === "Herb" && isFruitCrop(h),
    build: (h, c) =>
      `${c.common_name} stays low and harvestable at the edge of ${h.common_name}'s bed — kitchen herbs without shading the ${CATEGORY_PHRASE[h.category]}. Cut often so flowers don't distract from your main crop's energy.`,
  },
  {
    match: (h, c) => c.category === "Support Species",
    build: (h, c) => {
      const roles = c.guild_functions.filter((g) => g !== "Food Producer").slice(0, 2);
      const roleText = roles.length
        ? roles.map((r) => r.toLowerCase()).join(" and ")
        : "soil support";
      return `${c.common_name} is grown mainly for ${roleText}, not as the headline harvest. It backs up ${h.common_name} while you manage the ${CATEGORY_PHRASE[h.category]} as the guild centerpiece.`;
    },
  },
  {
    match: (h, c) => h.category === "Vegetable" && c.category === "Vegetable",
    build: (h, c) =>
      `${h.common_name} and ${c.common_name} can share a bed if you offset planting dates — one peaks while the other is young. Match water needs and leave airflow between leaves in humid ${regionPhrase(h)} summers.`,
  },
  {
    match: (h, c) => /solanum|capsicum|lycopersicon/i.test(`${h.scientific_name} ${c.scientific_name}`),
    build: (h, c) =>
      `Nightshades and peppers want the same fertile, well-drained soil — one feeding schedule covers both. Space wide enough that ${c.common_name} doesn't trap humidity against ${h.common_name} foliage.`,
  },
  {
    match: (h, c) => /ipomoea|sweet potato/i.test(nameBlob(c)),
    build: (h, c) =>
      `${c.common_name} sprawls as living mulch with edible tubers, cooling soil for ${h.common_name}'s roots. Let vines run outside the trunk zone so they don't girdle bark.`,
  },
];

const LAYER_FALLBACKS: ((h: CompanionReasonPlant, c: CompanionReasonPlant) => string)[] = [
  (h, c) =>
    `${c.common_name} fills the ${LAYER_PHRASE[c.canopy_layer]} while ${h.common_name} holds ${LAYER_PHRASE[h.canopy_layer]} — different heights mean different light budgets, so both can stay productive in one guild.`,
  (h, c) =>
    `Stacking ${c.common_name} under or beside ${h.common_name} mimics forest structure: canopy tree plus ${LAYER_PHRASE[c.canopy_layer]} crop. Roots at different depths reduce direct competition for water.`,
  (h, c) =>
    `In ${regionPhrase(h)}, pairing ${c.common_name} with ${h.common_name} spreads risk — if one struggles in a wet or dry year, the other may still carry the bed.`,
];

const GUILD_FALLBACKS: ((h: CompanionReasonPlant, c: CompanionReasonPlant) => string)[] = [
  (h, c) => {
    const benefit = c.benefits?.[0];
    if (benefit && benefit.length > 20) {
      return `${c.common_name} helps because ${benefit.charAt(0).toLowerCase()}${benefit.slice(1)} That pairs well with ${h.common_name} in this guild.`;
    }
    const cr = c.guild_functions[0];
    const hr = h.guild_functions[0];
    if (cr && hr && cr !== hr) {
      return `${c.common_name} focuses on ${cr.toLowerCase()} while ${h.common_name} handles ${hr.toLowerCase()} — complementary roles, not duplicate ones.`;
    }
    return "";
  },
  (h, c) =>
    `${c.common_name} is listed as a neighbor for ${h.common_name} because they share soil and climate without needing identical care. Give each plant room for its mature spread.`,
];

function layerStackFallback(
  host: CompanionReasonPlant,
  comp: CompanionReasonPlant,
): string {
  const gap = layerGap(host.canopy_layer, comp.canopy_layer);
  const idx = pairHash(host, comp) % LAYER_FALLBACKS.length;

  if (gap >= 2) {
    return LAYER_FALLBACKS[idx]!(host, comp);
  }
  if (gap === 1) {
    const under =
      ["Understory", "Shrub", "Herbaceous", "Groundcover"].indexOf(comp.canopy_layer) >=
      ["Understory", "Shrub", "Herbaceous", "Groundcover"].indexOf(host.canopy_layer);
    return under
      ? `${c.common_name} grows in the ${LAYER_PHRASE[comp.canopy_layer]} band below ${host.common_name}, using light that filters through the canopy. Harvest ${c.common_name} often so it doesn't become a thicket around the trunk.`
      : `${c.common_name} sits slightly ${LAYER_PHRASE[comp.canopy_layer]} relative to ${host.common_name} — close enough to share pollinators and soil biology, far enough to split root zones.`;
  }
  return `${comp.common_name} and ${host.common_name} share the ${LAYER_PHRASE[comp.canopy_layer]} — space them for mature spread. ${comp.guild_functions[0] ? `${comp.common_name} adds ${comp.guild_functions[0].toLowerCase()}; ` : ""}${host.common_name} remains your primary ${CATEGORY_PHRASE[host.category]} in this bed.`;
}

function guildComplementFallback(
  host: CompanionReasonPlant,
  comp: CompanionReasonPlant,
): string {
  for (const fn of GUILD_FALLBACKS) {
    const line = fn(host, comp);
    if (line) return line;
  }
  return layerStackFallback(host, comp);
}

export function buildEducationalCompanionReason(
  host: CompanionReasonPlant,
  companion: CompanionReasonPlant,
): string {
  const curated = lookupCuratedPairNote(host, companion);
  if (curated) return curated;

  for (const rule of COMPANION_RULES) {
    if (rule.match(host, companion)) {
      return rule.build(host, companion);
    }
  }
  return guildComplementFallback(host, companion);
}

export function buildEducationalAvoidReason(
  host: CompanionReasonPlant,
  other: CompanionReasonPlant,
): string {
  if (
    host.canopy_layer === other.canopy_layer &&
    layerGap(host.canopy_layer, other.canopy_layer) === 0 &&
    (host.category === other.category ||
      /fruit tree|citrus/i.test(host.category + other.category))
  ) {
    return `${host.common_name} and ${other.common_name} both want the same sun, water, and root zone as mature ${LAYER_PHRASE[host.canopy_layer]} plants. One usually outgrows the other or both need heavy irrigation in ${regionPhrase(host)} summers.`;
  }
  if (/walnut|juglans|fennel|foeniculum/i.test(nameBlob(other))) {
    return `${other.common_name} can release allelopathic compounds that slow ${host.common_name}'s growth when roots overlap. Separate them by at least each plant's mature spread.`;
  }
  if (/corn|zea mays/i.test(nameBlob(other)) && host.category === "Vegetable") {
    return `${other.common_name} shades smaller crops and draws corn earworm pressure that also hits tomatoes and peppers. Keep corn on the north edge of the site, not woven through the guild.`;
  }
  return `${host.common_name} and ${other.common_name} compete for the same niche — light, nutrients, or soil moisture. Spacing them apart reduces stress and often improves yields on both in ${regionPhrase(host)}.`;
}
