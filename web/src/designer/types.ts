import type { CanopyLayer, PlantSummary } from "../types";

/** Food-forest category filters in the designer sidebar. */
export type FilterKey =
  | "fruit_trees"
  | "fruits_vegetables"
  | "vines"
  | "herbs"
  | "flowers"
  | "support"
  | "natives";

export type CanvasPlant = {
  canvasId: string;
  plantId: string;
  trefle_id?: number;
  common_name: string;
  canopy_layer: CanopyLayer;
  canvas_radius_feet: number;
  image_url: string | null;
  is_invasive_in_florida: boolean;
  x: number;
  y: number;
};

export type PlantListItem = PlantSummary & {
  source?: "local" | "trefle";
  trefle_id?: number;
  trefle_slug?: string;
};

export type { WorkspaceZone, WorkspaceZoneShape, WorkspaceTool } from "./types/workspace";
