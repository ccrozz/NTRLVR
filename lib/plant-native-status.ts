import type { Plant } from "../schema.js";

/** VH021 / IFAS cultivar rows — recommended for FL gardens, not natives. */
export function isIfasCultivar(plant: {
  tags?: string[];
}): boolean {
  const tags = plant.tags ?? [];
  return (
    tags.includes("ifas") &&
    (tags.includes("tomato") ||
      tags.includes("pepper") ||
      tags.includes("squash"))
  );
}

/** Documented native (category, tag, or USDA + flag), not “grows in FL”. */
export function plantQualifiesAsDocumentedNative(plant: {
  category?: string;
  tags?: string[];
}): boolean {
  if (/\bnative\b/i.test(plant.category ?? "")) return true;
  return (plant.tags ?? []).some((t) => t.toLowerCase() === "native");
}

/**
 * Whether the plant is a true Florida native for display and filters.
 * Ignores loose Trefle “southeast US” flags and IFAS cultivar state tags.
 */
export function effectiveIsFloridaNative(plant: Plant): boolean {
  if (isIfasCultivar(plant)) return false;

  const flListed = (plant.native_states ?? []).some(
    (s) => s.toUpperCase() === "FL",
  );

  if (plantQualifiesAsDocumentedNative(plant)) {
    return plant.is_florida_native || flListed;
  }

  const cultivatedNotNative =
    plant.category === "Vegetable" ||
    plant.category === "Herb" ||
    plant.category === "Fruit Tree" ||
    plant.category === "Citrus" ||
    plant.category === "Tropical Fruit" ||
    plant.category === "Berry";
  if (cultivatedNotNative && !plantQualifiesAsDocumentedNative(plant)) {
    return false;
  }

  if (plant.is_florida_native && flListed) return true;

  return false;
}

/** State codes where the plant is documented as native (not merely region-tagged). */
export function effectiveNativeStates(plant: Plant): string[] {
  const out = new Set<string>();

  if (effectiveIsFloridaNative(plant)) {
    out.add("FL");
  }

  const documented = plantQualifiesAsDocumentedNative(plant);
  for (const st of plant.native_states ?? []) {
    const code = st.toUpperCase();
    if (code === "FL") continue;
    if (documented) out.add(code);
  }

  return [...out].sort();
}

export function plantIsNativeToState(plant: Plant, stateCode: string): boolean {
  const st = stateCode.toUpperCase();
  return effectiveNativeStates(plant).some((s) => s.toUpperCase() === st);
}
