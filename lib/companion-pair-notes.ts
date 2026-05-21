import type { CompanionReasonPlant } from "./companion-reason.js";

function normSci(name: string): string {
  return name.toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ").trim();
}

function normCommon(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function genusOf(p: CompanionReasonPlant): string {
  const g = p.genus?.trim().toLowerCase();
  if (g) return g;
  return p.scientific_name.split(/\s+/)[0]?.toLowerCase() ?? "";
}

/** Hand-written pairing notes — checked before generic rules. */
const BY_PAIR: Record<string, string> = {
  "asimina triloba::symphytum x uplandicum":
    "Pawpaw wants dappled shade as an understory tree; comfrey feeds it without stealing sun. Chop comfrey leaves onto the pawpaw basin — the deep taproot pulls potassium and calcium other plants can't reach.",
  "asimina triloba::symphytum":
    "Pawpaw fruits best with filtered light and steady soil moisture. Comfrey's chop-and-drop mulch keeps the root zone cool and adds minerals from subsoil without crowding the pawpaw canopy.",
  "asimina triloba::zingiber officinale":
    "Wild ginger and pawpaw both love shade and leaf litter — a natural forest-floor pairing. Ginger's spreading rhizomes stay shallow while pawpaw roots run deeper, so they share a site without fighting.",
  "olea europaea::symphytum x uplandicum":
    "Olives are heavy feeders in rocky soil; comfrey supplies potassium and mulch right at the drip line. Keep comfrey cut back so it doesn't shade the olive crown.",
  "mangifera indica::moringa oleifera":
    "Moringa fixes nitrogen and can be coppiced for mulch around young mango roots. Plant moringa on the sunnier edge so the mango keeps the main canopy harvest.",
  "mangifera indica::cymbopogon citratus":
    "Lemongrass repels some root pests and masks scent trails that attract mango leafhoppers. Run it as a border strip outside the mango drip line.",
  "persea americana::cajanus cajan":
    "Pigeon pea fixes nitrogen for hungry avocado roots and can be cut for mulch before it shades the tree. Replace or prune hard once avocado branches fill in.",
  "citrus x meyeri::salvia rosmarinus":
    "Rosemary's volatile oils deter soft-bodied pests that hit citrus leaves. Give rosemary full sun on the south edge while citrus keeps the protected center of the bed.",
  "diospyros virginiana::amorpha fruticosa":
    "Indigo and American persimmon are both native — indigo fixes nitrogen on disturbed edges while persimmon builds fruit in the canopy layer above.",
};

const BY_GENUS_PAIR: Record<string, string> = {
  "asimina::amorpha":
    "Native nitrogen-fixing indigo supports native pawpaw without chemical fertilizer. Keep indigo on the sunny shoulder of the planting where pawpaw gets afternoon shade.",
  "citrus::ocimum":
    "Basil and citrus share warm-season growth but basil repels some leaf pests when tucked at the drip line. Harvest basil often so it stays bushy and doesn't bolt into the tree.",
};

function pairKey(host: CompanionReasonPlant, comp: CompanionReasonPlant): string {
  return `${normSci(host.scientific_name)}::${normSci(comp.scientific_name)}`;
}

export function lookupCuratedPairNote(
  host: CompanionReasonPlant,
  comp: CompanionReasonPlant,
): string | null {
  const direct = BY_PAIR[pairKey(host, comp)];
  if (direct) return direct;

  const gh = genusOf(host);
  const gc = genusOf(comp);
  if (gh && gc) {
    const g1 = `${gh}::${gc}`;
    const g2 = `${gc}::${gh}`;
    return BY_GENUS_PAIR[g1] ?? BY_GENUS_PAIR[g2] ?? null;
  }

  const commonKey = `${normCommon(host.common_name)}::${normCommon(comp.common_name)}`;
  const aliases: Record<string, string> = {
    "pawpaw::comfrey": BY_PAIR["asimina triloba::symphytum x uplandicum"]!,
    "pawpaw::wild ginger": BY_PAIR["asimina triloba::zingiber officinale"]!,
  };
  return aliases[commonKey] ?? null;
}
