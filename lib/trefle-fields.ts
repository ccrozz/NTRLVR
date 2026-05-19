import type { TrefleGrowth, TreflePlantDetail, TrefleSpecies } from "../trefle/types.js";

function species(detail: TreflePlantDetail): TrefleSpecies | null {
  return detail.main_species ?? null;
}

export function inferBenefitsFromTrefle(detail: TreflePlantDetail): string[] {
  const sp = species(detail);
  if (!sp) return [];

  const benefits: string[] = [];
  const growth = sp.growth;
  const specs = sp.specifications;

  if (sp.edible || sp.edible_part) {
    const part = sp.edible_part ? ` (${sp.edible_part})` : "";
    benefits.push(`Edible plant${part}`);
  }
  if (sp.vegetable) benefits.push("Grown as a vegetable");

  if (specs?.nitrogen_fixation && !/none|null/i.test(specs.nitrogen_fixation)) {
    benefits.push("May fix nitrogen in the soil");
  }

  if (growth?.ph_minimum != null && growth?.ph_maximum != null) {
    benefits.push(`Prefers soil pH ${growth.ph_minimum}–${growth.ph_maximum}`);
  }

  if (growth?.bloom_months?.length) {
    benefits.push(`Blooms: ${growth.bloom_months.join(", ")}`);
  }
  if (growth?.fruit_months?.length) {
    benefits.push(`Fruit season: ${growth.fruit_months.join(", ")}`);
  }

  if (specs?.toxicity && !/none/i.test(specs.toxicity)) {
    benefits.push(`Toxicity note: ${specs.toxicity}`);
  }

  const native = sp.distribution?.native;
  if (native?.length) {
    benefits.push(`Native range includes ${native.slice(0, 4).join(", ")}`);
  }

  return benefits.filter((b) => b.length > 8 && b.length < 220);
}

export function buildCareSummaryFromTrefle(detail: TreflePlantDetail): string {
  const sp = species(detail);
  if (!sp) return "";

  const parts: string[] = [];
  if (sp.observations) parts.push(sp.observations);
  if (detail.observations && detail.observations !== sp.observations) {
    parts.push(detail.observations);
  }

  const growth = sp.growth as TrefleGrowth | null | undefined;
  if (growth?.description) parts.push(growth.description);
  if (growth?.sowing) parts.push(`Sowing: ${growth.sowing}`);

  const specs = sp.specifications;
  if (specs?.growth_habit) parts.push(`Growth habit: ${specs.growth_habit}`);
  if (specs?.growth_form) parts.push(`Form: ${specs.growth_form}`);
  if (growth?.light != null) {
    const light =
      growth.light <= 3
        ? "shade tolerant"
        : growth.light >= 7
          ? "full sun"
          : "partial sun";
    parts.push(`Light: ${light}`);
  }

  return parts.join(". ").replace(/\.\.+/g, ".").trim();
}
