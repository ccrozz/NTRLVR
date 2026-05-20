import type { GuildFunction } from "../../types";

export type GuildFunctionCard = {
  icon: string;
  label: string;
  description: string;
};

export const GUILD_FUNCTION_CARDS: Record<GuildFunction, GuildFunctionCard> = {
  "Nitrogen Fixer": {
    icon: "🌱",
    label: "Feeds the soil",
    description:
      "Pulls nitrogen from the air and deposits it into the soil — acts as free fertilizer for nearby plants.",
  },
  "Dynamic Accumulator": {
    icon: "⛏",
    label: "Mines deep nutrients",
    description:
      "Deep taproots break up hardpan and bring up minerals that shallow-rooted plants can't reach.",
  },
  "Pollinator Attractor": {
    icon: "🐝",
    label: "Brings the bees",
    description:
      "Flowers attract pollinators that improve fruit set across your entire garden.",
  },
  "Pest Repellent": {
    icon: "🛡",
    label: "Protects neighbors",
    description:
      "Aromatic compounds confuse and deter pests from surrounding plants.",
  },
  "Wind Break": {
    icon: "💨",
    label: "Shields the garden",
    description:
      "Provides a physical barrier that reduces wind stress on more sensitive plants.",
  },
  "Groundcover/Mulch": {
    icon: "🍂",
    label: "Feeds the soil surface",
    description:
      "Living or dropped biomass suppresses weeds and keeps soil moisture locked in.",
  },
  "Food Producer": {
    icon: "🍽",
    label: "Feeds you",
    description:
      "Produces edible yields — the direct harvest that makes the garden worth designing.",
  },
  Medicinal: {
    icon: "💊",
    label: "Natural medicine",
    description:
      "Compounds in this plant have documented healing or therapeutic uses.",
  },
  "Wildlife Habitat": {
    icon: "🦋",
    label: "Supports biodiversity",
    description:
      "Provides food, shelter, or breeding ground for birds, insects, and beneficial wildlife.",
  },
};
