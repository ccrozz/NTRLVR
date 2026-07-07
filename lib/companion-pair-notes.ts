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
  "annona muricata::carica papaya":
    "Soursop and papaya both like warm, humid Florida sites with steady moisture. Papaya fills a faster fruiting niche beside the slower soursop canopy without the same root depth.",
  "annona squamosa::cymbopogon citratus":
    "Sugar apple flowers benefit from fewer chewing pests when lemongrass grows just outside the drip line. The grass also marks the bed edge so mowers stay away from shallow annona roots.",
  "annona reticulata::tagetes":
    "Custard apple sets better in Florida when marigold confuses soil pests at the surface. Keep marigold low and sunny — custard apple wants airflow through the lower branches.",
  "annona glabra::hamelia patens":
    "Pond apple and firebush are both wetland-edge natives that feed pollinators through the warm season. Firebush draws hummingbirds while pond apple handles periodic flooding.",
  "annona x atemoya::annona squamosa":
    "Atemoya is a cherimoya × sugar apple cross — a nearby sugar apple improves pollination timing on many Florida trees. Plant the pollinizer upwind of the main atemoya.",
  "mangifera indica::curcuma longa":
    "Turmeric's dense rhizomes suppress weeds under mango drip lines without competing for canopy light. Chop turmeric leaves for mulch when mango is flushing new growth.",
  "mangifera indica::tagetes":
    "French marigold roots release compounds that reduce soil nematode pressure — a common issue under older Florida mango trees. Keep marigold in full sun on the south edge.",
  "persea americana::mangifera indica":
    "Mango and avocado share warm, well-drained sites but avocado roots are shallow and sensitive to flooding. Plant mango slightly uphill or on the drier shoulder of the bed.",
  "persea americana::salvia rosmarinus":
    "Rosemary tolerates the drier, airier edge avocado wants while repelling some soft-bodied pests. Never plant rosemary where avocado roots stay waterlogged.",
  "carica papaya::cymbopogon citratus":
    "Papaya grows fast and benefits from lemongrass borders that confuse flying pests. Replace papaya after fruiting — lemongrass stays as a permanent edge.",
  "carica papaya::zingiber officinale":
    "Ginger and papaya both love heat and steady moisture but ginger stays low while papaya shoots up quickly. Harvest ginger before papaya roots spread wide.",
  "litchi chinensis::zingiber officinale":
    "Lychee needs excellent drainage; ginger on raised mounds at the drip line improves airflow and gives you a harvest without shading the lychee crown.",
  "psidium guajava::tagetes":
    "Guava fruit flies and root nematodes are common in Florida; marigold as a low border helps on both fronts. Renew marigold each warm season for best effect.",
  "theobroma cacao::musa acuminata":
    "Cacao wants filtered shade — dwarf banana provides quick canopy cover while you wait for cacao to size up. Cut banana pseudostems after fruiting to keep light on cacao.",
  "cocos nucifera::ananas comosus":
    "Pineapple and coconut both thrive in sandy, coastal Florida soils. Pineapple fills the sunny ground layer while coconut handles salt spray above.",
  "diospyros kaki::allium schoenoprasum":
    "Non-astringent persimmon sets heavier crops with steady potassium; chives at the drip line add light allium chemistry without deep root competition.",
  "macadamia integrifolia::tagetes":
    "Macadamia is a slow starter — marigold suppresses weeds and nematodes in the open basin for the first few years while roots establish.",
  "eugenia uniflora::hamelia patens":
    "Surinam cherry and firebush are both tough subtropical shrubs that feed pollinators through Florida's warm months. Firebush draws hummingbirds to improve cherry set.",
  "ziziphus jujuba::lavandula angustifolia":
    "Jujube tolerates heat and drought once established; lavender on the sunny, well-drained edge matches that regime and brings pollinators to spring flowers.",
};

const BY_GENUS_PAIR: Record<string, string> = {
  "asimina::amorpha":
    "Native nitrogen-fixing indigo supports native pawpaw without chemical fertilizer. Keep indigo on the sunny shoulder of the planting where pawpaw gets afternoon shade.",
  "citrus::ocimum":
    "Basil and citrus share warm-season growth but basil repels some leaf pests when tucked at the drip line. Harvest basil often so it stays bushy and doesn't bolt into the tree.",
  "citrus::tagetes":
    "Marigold at the citrus drip line helps with nematodes and draws pollinators when citrus blooms overlap. Keep plants low so airflow reaches the trunk.",
  "psidium::tagetes":
    "Guava benefits from marigold's nematode-suppressing roots in Florida sandy soils. Plant on the sunniest bed edge and replant marigold yearly.",
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
