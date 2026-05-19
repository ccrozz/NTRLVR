export type WorkspaceZoneShape = "rectangle" | "circle" | "polygon";

export type WorkspaceZone = {
  id: string;
  name: string;
  shape: WorkspaceZoneShape;
  /** Top-left corner (px) for rectangle */
  x?: number;
  y?: number;
  widthFeet?: number;
  heightFeet?: number;
  /** Center (px) for circle */
  cx?: number;
  cy?: number;
  radiusFeet?: number;
  /** Vertices (px) for drawn / custom polygon */
  points?: { x: number; y: number }[];
};

export type WorkspaceTool = "select" | "draw-zone";
