import type { Plant } from "../schema.js";
import {
  finalizePlantBenefits,
  hasMeaningfulBenefits,
  sanitizeBenefits,
} from "./infer-plant-benefits.js";
import { applyEdibleFlag } from "./infer-is-edible.js";

const PLACEHOLDER_USES = new Set(["Ornamental", "Edible"]);
const GENERIC_GUILD = new Set(["Wildlife Habitat"]);

export function plantNeedsEnrichment(plant: Plant): boolean {
  const thinCare = plant.care_summary.trim().length < 40;
  const genericUses =
    plant.uses.length === 0 ||
    (plant.uses.length === 1 && PLACEHOLDER_USES.has(plant.uses[0]));
  const noBenefits = !hasMeaningfulBenefits(plant.benefits);
  const genericGuild =
    plant.guild_functions.length === 1 &&
    GENERIC_GUILD.has(plant.guild_functions[0]);

  return thinCare || genericUses || (noBenefits && genericGuild);
}

export type EnrichmentResult = {
  plant: Plant;
  sources: string[];
  enriched: boolean;
};

export function mergeEnrichedPlant(
  base: Plant,
  patch: Partial<Plant>,
  sourceLabel: string,
): Plant {
  const tags = new Set([...base.tags, "web-enriched", sourceLabel.toLowerCase()]);

  return {
    ...base,
    ...patch,
    id: base.id,
    care_summary: patch.care_summary?.trim()
      ? patch.care_summary.trim()
      : base.care_summary,
    image_url:
      typeof patch.image_url === "string"
        ? patch.image_url
        : base.image_url ?? null,
    uses:
      patch.uses && patch.uses.length > 0 && !isPlaceholderUses(patch.uses)
        ? patch.uses
        : base.uses,
    is_edible: patch.is_edible === true ? true : base.is_edible,
    native_states:
      patch.native_states && patch.native_states.length > 0
        ? patch.native_states
        : base.native_states,
    is_florida_native:
      patch.native_states?.includes("FL") || patch.is_florida_native === true
        ? true
        : base.is_florida_native,
    grows_in_us:
      patch.grows_in_us === true ? true : base.grows_in_us,
    benefits: sanitizeBenefits(
      mergeStringArrays(base.benefits, patch.benefits ?? []),
    ),
    companion_plants: mergeStringArrays(
      base.companion_plants,
      patch.companion_plants ?? [],
    ),
    avoid_planting_near: mergeStringArrays(
      base.avoid_planting_near,
      patch.avoid_planting_near ?? [],
    ),
    guild_functions:
      patch.guild_functions &&
      patch.guild_functions.length > 0 &&
      !isGenericGuildOnly(patch.guild_functions)
        ? patch.guild_functions
        : base.guild_functions,
    florida_hardiness_zones:
      patch.florida_hardiness_zones &&
      patch.florida_hardiness_zones.length > 0
        ? [
            ...new Set([
              ...base.florida_hardiness_zones,
              ...patch.florida_hardiness_zones,
            ]),
          ]
        : base.florida_hardiness_zones,
    tags: [...tags],
    last_updated: new Date().toISOString().slice(0, 10),
  };
}

function isPlaceholderUses(uses: string[]): boolean {
  return uses.every((u) => PLACEHOLDER_USES.has(u));
}

function isGenericGuildOnly(fns: string[]): boolean {
  return fns.length === 1 && GENERIC_GUILD.has(fns[0]);
}

function mergeStringArrays(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].filter(Boolean);
}

export function needsBenefitsEnrichment(plant: Plant): boolean {
  return !hasMeaningfulBenefits(plant.benefits);
}

export function needsNativeStateEnrichment(plant: Plant): boolean {
  return (
    plant.native_states.length === 0 &&
    plant.scientific_name.trim().length > 2
  );
}

export function needsHardinessEnrichment(plant: Plant): boolean {
  return plant.florida_hardiness_zones.length === 0;
}

export function needsUsScopeEnrichment(plant: Plant): boolean {
  return !plant.grows_in_us && plant.scientific_name.trim().length > 2;
}

export function plantNeedsAnyEnrichment(plant: Plant): boolean {
  return (
    plantNeedsEnrichment(plant) ||
    needsRelationEnrichment(plant) ||
    needsNativeStateEnrichment(plant) ||
    needsHardinessEnrichment(plant) ||
    needsUsScopeEnrichment(plant) ||
    !plant.trefle_json?.length
  );
}

export function needsRelationEnrichment(plant: Plant): boolean {
  return (
    needsBenefitsEnrichment(plant) ||
    plant.companion_plants.length === 0 ||
    plant.avoid_planting_near.length === 0
  );
}

export function applyFinalBenefits(plant: Plant): Plant {
  return applyEdibleFlag({
    ...plant,
    benefits: finalizePlantBenefits(plant),
  });
}
