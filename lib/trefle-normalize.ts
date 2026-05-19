import type { GrowthRate, SunlightNeeds, WaterNeeds } from "../schema.js";

export function normalizeTrefleLight(value: number | null): SunlightNeeds {
  if (value == null) return "Adaptable";
  if (value <= 3) return "Full Shade";
  if (value <= 6) return "Partial Shade";
  return "Full Sun";
}

export function normalizeTrefleWater(value: number | null): WaterNeeds {
  if (value == null) return "Moderate";
  if (value <= 2) return "Drought Tolerant";
  if (value <= 4) return "Low";
  if (value <= 7) return "Moderate";
  return "High";
}

export function normalizeTrefleGrowthRate(value: string | null): GrowthRate {
  if (!value) return "Moderate";
  const v = value.toLowerCase();
  if (v.includes("slow")) return "Slow";
  if (v.includes("fast") || v.includes("rapid")) return "Fast";
  return "Moderate";
}

export function cmToFeet(cm: number | null): number {
  if (cm == null || Number.isNaN(cm)) return 0;
  return Math.round((cm / 30.48) * 10) / 10;
}
