import type { CanopyLayer } from "../../types";

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
