import type { CanopyLayer } from "../../types";
import type { CanvasPlant } from "../types";
import { CANOPY_LAYER_ORDER, canopyColor } from "./canopy-colors";
import { getCategoryIllustration } from "./plant-illustrations";
import { plantProfileGeometry } from "./cross-section-profile";

const GROUND_Y_RATIO = 0.86;
const SIDE_PADDING = 72;
const BASE_MIN_GAP = 28;
const RULER_WIDTH = 40;

export type SilhouetteLayoutItem = {
  plant: CanvasPlant;
  screenX: number;
  heightPx: number;
  colors: ReturnType<typeof canopyColor>;
  ill: ReturnType<typeof getCategoryIllustration>;
  geom: ReturnType<typeof plantProfileGeometry>;
  drawOrder: number;
};

export type SilhouetteLayout = {
  items: SilhouetteLayoutItem[];
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  maxHeightFt: number;
  rulerTicks: number[];
};

function minCenterGap(a: CanvasPlant, b: CanvasPlant): number {
  const spreadA = Math.max(20, a.canvas_radius_feet * 20 * 1.05);
  const spreadB = Math.max(20, b.canvas_radius_feet * 20 * 1.05);
  return Math.max(BASE_MIN_GAP, (spreadA + spreadB) * 0.42);
}

export function buildSilhouetteLayout(
  plants: CanvasPlant[],
  hiddenLayers: CanopyLayer[],
): SilhouetteLayout {
  const worldHeight = 400;
  const groundY = worldHeight * GROUND_Y_RATIO;

  const visible = plants
    .filter((p) => !hiddenLayers.includes(p.canopy_layer))
    .sort((a, b) => a.x - b.x);

  if (!visible.length) {
    return {
      items: [],
      worldWidth: 400,
      worldHeight,
      groundY,
      maxHeightFt: 40,
      rulerTicks: [0, 10, 20, 30, 40],
    };
  }

  const xs = visible.map((p) => p.x);
  const minX = Math.min(...xs) - 40;
  const maxX = Math.max(...xs) + 40;
  const spanX = Math.max(maxX - minX, 120);

  const maxHeightFt = Math.min(
    48,
    Math.max(8, ...visible.map((p) => p.mature_height_feet[1] ?? 6)),
  );
  const scaleY = (groundY - 32) / maxHeightFt;

  const innerWidth = Math.max(
    visible.length * 44,
    spanX * 0.5,
    240,
  );

  const idealXs = visible.map(
    (p) => SIDE_PADDING + ((p.x - minX) / spanX) * innerWidth,
  );

  const screenXs: number[] = [];
  for (let i = 0; i < visible.length; i++) {
    const prev = visible[i - 1];
    const floor =
      i === 0
        ? SIDE_PADDING
        : screenXs[i - 1]! +
          (prev ? minCenterGap(prev, visible[i]!) : BASE_MIN_GAP);
    screenXs.push(Math.max(idealXs[i]!, floor));
  }

  const worldWidth = Math.max(
    380,
    (screenXs[screenXs.length - 1] ?? SIDE_PADDING) + SIDE_PADDING,
  );

  const items: SilhouetteLayoutItem[] = visible.map((p, i) => {
    const maxH = p.mature_height_feet[1] ?? 6;
    const heightPx = Math.max(14, maxH * scaleY);
    return {
      plant: p,
      screenX: screenXs[i]!,
      heightPx,
      colors: canopyColor(p.canopy_layer),
      ill: getCategoryIllustration(p.category),
      geom: plantProfileGeometry(p, heightPx),
      drawOrder: CANOPY_LAYER_ORDER[p.canopy_layer] ?? 2,
    };
  });

  items.sort((a, b) => a.drawOrder - b.drawOrder);

  const rulerMax = Math.ceil(maxHeightFt / 10) * 10;
  const rulerTicks: number[] = [];
  for (let ft = 0; ft <= rulerMax; ft += 10) rulerTicks.push(ft);

  return {
    items,
    worldWidth,
    worldHeight,
    groundY,
    maxHeightFt,
    rulerTicks,
  };
}

export { RULER_WIDTH };
