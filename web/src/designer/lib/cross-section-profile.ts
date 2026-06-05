import type { CanopyLayer } from "../../types";
import type { CanvasPlant } from "../types";
import { PX_PER_FOOT } from "./canvas-utils";

export type ProfileBlob = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type PlantProfileGeom = {
  heightPx: number;
  spreadPx: number;
  trunkW: number;
  trunkH: number;
  crownBlobs: ProfileBlob[];
  topY: number;
};

const CROWN_RATIO: Record<CanopyLayer, number> = {
  Overstory: 0.62,
  Understory: 0.55,
  Shrub: 0.68,
  Herbaceous: 0.82,
  Groundcover: 0.9,
  Root: 0.4,
  Vine: 0.58,
};

const TRUNK_WIDTH_RATIO: Record<CanopyLayer, number> = {
  Overstory: 0.09,
  Understory: 0.11,
  Shrub: 0.12,
  Herbaceous: 0.06,
  Groundcover: 0.04,
  Root: 0.05,
  Vine: 0.06,
};

function treeCrown(
  spreadPx: number,
  crownH: number,
  topY: number,
): ProfileBlob[] {
  return [
    {
      cx: 0,
      cy: topY + crownH * 0.52,
      rx: spreadPx * 0.48,
      ry: crownH * 0.48,
    },
    {
      cx: -spreadPx * 0.18,
      cy: topY + crownH * 0.68,
      rx: spreadPx * 0.32,
      ry: crownH * 0.34,
    },
    {
      cx: spreadPx * 0.16,
      cy: topY + crownH * 0.62,
      rx: spreadPx * 0.28,
      ry: crownH * 0.3,
    },
  ];
}

function bushCrown(
  spreadPx: number,
  crownH: number,
  topY: number,
): ProfileBlob[] {
  const w = spreadPx * 0.44;
  const h = crownH * 0.42;
  const midY = topY + crownH * 0.58;
  return [
    { cx: 0, cy: midY, rx: w, ry: h },
    { cx: -w * 0.55, cy: midY + h * 0.12, rx: w * 0.72, ry: h * 0.82 },
    { cx: w * 0.5, cy: midY + h * 0.08, rx: w * 0.68, ry: h * 0.78 },
  ];
}

function moundCrown(
  spreadPx: number,
  crownH: number,
  topY: number,
): ProfileBlob[] {
  return [
    {
      cx: 0,
      cy: topY + crownH * 0.72,
      rx: spreadPx * 0.5,
      ry: crownH * 0.55,
    },
  ];
}

function vineCrown(
  spreadPx: number,
  crownH: number,
  topY: number,
): ProfileBlob[] {
  return [
    {
      cx: spreadPx * 0.12,
      cy: topY + crownH * 0.45,
      rx: spreadPx * 0.38,
      ry: crownH * 0.42,
    },
    {
      cx: -spreadPx * 0.08,
      cy: topY + crownH * 0.72,
      rx: spreadPx * 0.3,
      ry: crownH * 0.28,
    },
  ];
}

export function plantProfileGeometry(
  plant: CanvasPlant,
  heightPx: number,
): PlantProfileGeom {
  const layer = plant.canopy_layer;
  const crownRatio = CROWN_RATIO[layer] ?? 0.6;
  const crownH = Math.max(10, heightPx * crownRatio);
  const trunkH = Math.max(0, heightPx - crownH);
  const spreadPx = Math.max(
    20,
    Math.min(110, plant.canvas_radius_feet * PX_PER_FOOT * 1.05),
  );
  const trunkW = Math.max(
    3,
    spreadPx * (TRUNK_WIDTH_RATIO[layer] ?? 0.1),
  );
  const topY = -heightPx;

  let crownBlobs: ProfileBlob[];
  switch (layer) {
    case "Overstory":
    case "Understory":
      crownBlobs = treeCrown(spreadPx, crownH, topY);
      break;
    case "Shrub":
      crownBlobs = bushCrown(spreadPx, crownH, topY);
      break;
    case "Vine":
      crownBlobs = vineCrown(spreadPx, crownH, topY);
      break;
    case "Herbaceous":
    case "Groundcover":
    case "Root":
      crownBlobs = moundCrown(spreadPx, crownH, topY);
      break;
    default:
      crownBlobs = treeCrown(spreadPx, crownH, topY);
  }

  return {
    heightPx,
    spreadPx,
    trunkW,
    trunkH: layer === "Groundcover" || layer === "Root" ? 0 : trunkH,
    crownBlobs,
    topY,
  };
}
