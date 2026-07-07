/** Normalize companion / avoid labels for overlap checks (e.g. "Corn" vs "Corn (shade and pest)"). */
export function normalizeRelationPlantName(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

/** Drop avoid entries that contradict companion entries. Companions win. */
export function reconcileCompanionLists(
  companion_plants: string[],
  avoid_planting_near: string[],
): { companion_plants: string[]; avoid_planting_near: string[] } {
  const companionKeys = new Set(
    companion_plants.map(normalizeRelationPlantName).filter(Boolean),
  );
  if (!companionKeys.size) {
    return { companion_plants, avoid_planting_near };
  }

  const filteredAvoid = avoid_planting_near.filter(
    (entry) => !companionKeys.has(normalizeRelationPlantName(entry)),
  );

  return { companion_plants, avoid_planting_near: filteredAvoid };
}

const GENERIC_UNDERSTORY_TEMPLATE = [
  "comfrey",
  "sweet potato",
  "pigeon pea",
  "lemongrass",
] as const;

const GENERIC_CITRUS_TEMPLATE = [
  "comfrey",
  "rosemary",
  "lemongrass",
  "pigeon pea",
] as const;

const GENERIC_MANGO_TEMPLATE = [
  "moringa",
  "lemongrass",
  "sweet potato",
  "pigeon pea",
] as const;

const GENERIC_AVOCADO_TEMPLATE = [
  "mango",
  "moringa",
  "comfrey",
  "lemongrass",
] as const;

function matchesTemplate(
  companion_plants: string[],
  template: readonly string[],
): boolean {
  const names = companion_plants.map(normalizeRelationPlantName);
  if (names.length !== template.length) return false;
  return template.every((token) =>
    names.some((n) => n === token || n.includes(token)),
  );
}

/** True when a list is the copy-paste food-forest understory quartet (not species-specific). */
export function isGenericUnderstoryGuild(companion_plants: string[]): boolean {
  return matchesTemplate(companion_plants, GENERIC_UNDERSTORY_TEMPLATE);
}

/** Skip genus/category fallbacks that repeat the same guild for unrelated species. */
export function isGenericCompanionGuild(companion_plants: string[]): boolean {
  return (
    isGenericUnderstoryGuild(companion_plants) ||
    matchesTemplate(companion_plants, GENERIC_CITRUS_TEMPLATE) ||
    matchesTemplate(companion_plants, GENERIC_MANGO_TEMPLATE) ||
    matchesTemplate(companion_plants, GENERIC_AVOCADO_TEMPLATE)
  );
}
