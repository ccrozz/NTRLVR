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
