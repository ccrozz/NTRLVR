import type { CanopyLayer, GuildFunction, PlantCategory } from "../schema.js";
import { getPlantById } from "../db/plant-repository.js";
import { SEED_BY_ID } from "../data/plants.seed.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import {
  buildEducationalAvoidReason,
  buildEducationalCompanionReason,
} from "./companion-reason-copy.js";

export type CompanionReasonPlant = {
  id?: string;
  common_name: string;
  scientific_name: string;
  guild_functions: GuildFunction[];
  canopy_layer: CanopyLayer;
  category: PlantCategory;
  family?: string | null;
  genus?: string | null;
  benefits?: string[];
  uses?: string[];
  care_summary?: string;
  native_states?: string[];
};

const sessionCache = new Map<string, string>();

function cacheKey(aId: string, bId: string, avoid: boolean): string {
  const [x, y] = [aId, bId].sort();
  return `${avoid ? "avoid" : "pair"}:v3:${x}:${y}`;
}

function plantId(p: CompanionReasonPlant): string {
  return p.id ?? p.common_name.trim().toLowerCase();
}

/** Load full guild roles from catalog so reasons are specific, not generic. */
export async function resolveReasonPlant(
  payload: CompanionReasonPlant,
): Promise<CompanionReasonPlant> {
  const id = payload.id?.trim();
  if (!id) return payload;

  const raw = (await getPlantById(id)) ?? SEED_BY_ID[id];
  if (!raw) return payload;

  const full = applyDesignerProfile(raw);
  return {
    id: full.id,
    common_name: full.common_name,
    scientific_name: full.scientific_name,
    guild_functions: full.guild_functions,
    canopy_layer: full.canopy_layer,
    category: full.category,
    family: full.family,
    genus: full.genus,
    benefits: full.benefits,
    uses: full.uses,
    care_summary: full.care_summary,
    native_states: full.native_states,
  };
}

async function callAnthropic(
  host: CompanionReasonPlant,
  companion: CompanionReasonPlant,
  avoid: boolean,
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const hostRoles = host.guild_functions.join(", ") || "grower";
  const compRoles = companion.guild_functions.join(", ") || "support";

  const system = avoid
    ? `You are an expert permaculturalist advising a home gardener in Florida. In exactly 2 sentences, explain why these two plants should NOT be planted near each other. Name the specific conflict (light, water, allelopathy, pests, or root competition). Plain, warm language. No bullet points.`
    : `You are an expert permaculturalist advising a home gardener in Florida. In exactly 2 sentences, explain why these two plants belong together in a food forest guild. Name the specific functional exchange — what does each plant give or receive? Mention canopy layer or guild role when relevant. Plain, warm language. No bullet points. Never use generic phrases like "stack different canopy layers" without explaining the actual benefit.`;

  const userMessage = avoid
    ? `Host plant: ${host.common_name} (${host.scientific_name}), ${host.canopy_layer} ${host.category}, roles: ${hostRoles}.\nOther plant: ${companion.common_name} (${companion.scientific_name}), ${companion.canopy_layer} ${companion.category}, roles: ${compRoles}.\nWhy keep them apart in a Florida garden?`
    : `Centerpiece plant: ${host.common_name} (${host.scientific_name}), ${host.canopy_layer} ${host.category}, roles: ${hostRoles}.\nCompanion to plant nearby: ${companion.common_name} (${companion.scientific_name}), ${companion.canopy_layer} ${companion.category}, roles: ${compRoles}.\nWhy do they belong together in a Florida food forest guild?`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 220,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(
      `[companion-reason] Anthropic ${res.status}: ${errBody.slice(0, 200)}`,
    );
    return null;
  }
  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  return text ?? null;
}

const GENERIC_FALLBACK_RE =
  /stack different canopy layers|stable mini-guild around your centerpiece|share space without fighting for the same niche/i;

/** Instant rule-based copy (no Anthropic). Used for batch panel load. */
export async function generateCompanionReasonFast(
  plantA: CompanionReasonPlant,
  plantB: CompanionReasonPlant,
  options?: { avoid?: boolean },
): Promise<string> {
  const avoid = options?.avoid ?? false;
  const host = await resolveReasonPlant(plantA);
  const companion = await resolveReasonPlant(plantB);
  return avoid
    ? buildEducationalAvoidReason(host, companion)
    : buildEducationalCompanionReason(host, companion);
}

export async function generateCompanionReason(
  plantA: CompanionReasonPlant,
  plantB: CompanionReasonPlant,
  options?: { avoid?: boolean; fast?: boolean; useAi?: boolean },
): Promise<string> {
  const avoid = options?.avoid ?? false;
  const fast = options?.fast ?? false;
  const useAi = fast
    ? false
    : (options?.useAi ?? process.env.COMPANION_REASON_AI === "true");

  const host = await resolveReasonPlant(plantA);
  const companion = await resolveReasonPlant(plantB);

  const key = cacheKey(plantId(host), plantId(companion), avoid);
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const educational = avoid
    ? buildEducationalAvoidReason(host, companion)
    : buildEducationalCompanionReason(host, companion);

  let reason = educational;

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  if (useAi && hasApiKey) {
    const fromApi = await callAnthropic(host, companion, avoid);
    if (fromApi && !GENERIC_FALLBACK_RE.test(fromApi)) {
      reason = fromApi;
    }
  }

  sessionCache.set(key, reason);
  return reason;
}

/** All companion “why” lines for a host in one fast pass. */
export async function generateCompanionReasonsBatch(
  hostId: string,
  companionIds: string[],
): Promise<Record<string, string>> {
  const hostRow = await resolveReasonPlant({
    id: hostId,
    common_name: hostId,
    scientific_name: "",
    guild_functions: [],
    canopy_layer: "Overstory",
    category: "Fruit Tree",
  });

  const out: Record<string, string> = {};
  for (const cid of companionIds) {
    const compRow = await resolveReasonPlant({
      id: cid,
      common_name: cid,
      scientific_name: "",
      guild_functions: [],
      canopy_layer: "Herbaceous",
      category: "Vegetable",
    });
    out[cid] = buildEducationalCompanionReason(hostRow, compRow);
  }
  return out;
}
