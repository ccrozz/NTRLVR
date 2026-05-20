import type { CanopyLayer } from "../../types";

/** Konva z-order: lower renders first (behind). */
export const CANOPY_LAYER_ORDER: Record<CanopyLayer, number> = {
  Overstory: 0,
  Understory: 1,
  Shrub: 2,
  Herbaceous: 3,
  Groundcover: 4,
  Root: 4,
  Vine: 5,
};

export const CENTER_DOT_RATIO: Record<CanopyLayer, number> = {
  Overstory: 0.08,
  Understory: 0.12,
  Shrub: 0.25,
  Herbaceous: 0.35,
  Groundcover: 0.6,
  Root: 0.4,
  Vine: 0,
};

export const CANOPY_COLORS: Record<
  CanopyLayer,
  { fill: string; stroke: string; label: string }
> = {
  Overstory: { fill: "#1a4731", stroke: "#1a4731", label: "Overstory" },
  Understory: { fill: "#2d6a4f", stroke: "#2d6a4f", label: "Understory" },
  Shrub: { fill: "#74a57f", stroke: "#5d8a68", label: "Shrub" },
  Herbaceous: { fill: "#a8c686", stroke: "#8fad6e", label: "Herbaceous" },
  Groundcover: { fill: "#c9b99a", stroke: "#a89878", label: "Groundcover" },
  Root: { fill: "#8b6e52", stroke: "#6f5842", label: "Root" },
  Vine: { fill: "#6b9e7a", stroke: "#558566", label: "Vine" },
};

export function canopyColor(layer: CanopyLayer) {
  return CANOPY_COLORS[layer] ?? CANOPY_COLORS.Shrub;
}

/** Hex (#rrggbb) → rgba for Konva gradients. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
