export type CanvasLabelMode = "trees" | "all" | "off";

export const LABEL_MODE_LABEL: Record<CanvasLabelMode, string> = {
  trees: "Names: trees only",
  all: "Names: every plant",
  off: "Names: on select only",
};

export function nextLabelMode(mode: CanvasLabelMode): CanvasLabelMode {
  if (mode === "trees") return "all";
  if (mode === "all") return "off";
  return "trees";
}
