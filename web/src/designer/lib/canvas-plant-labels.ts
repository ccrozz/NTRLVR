export type PlantLabelInput = {
  canvasId: string;
  x: number;
  y: number;
  radiusPx: number;
  name: string;
  /** Higher priority labels are placed first and kept when space is tight. */
  priority: number;
};

export type PlantLabelLayout = {
  show: boolean;
  offsetX: number;
  offsetY: number;
  align: "center" | "left" | "right";
  text: string;
  fontSize: number;
  width: number;
  height: number;
};

type Rect = { x0: number; y0: number; x1: number; y1: number };

type LabelCandidate = {
  offsetX: number;
  offsetY: number;
  align: "center" | "left" | "right";
};

export type LayoutCanvasPlantLabelsOptions = {
  isMobile: boolean;
  zoom: number;
  /** When true, attempt a label for every plant (subject to collision). */
  showAll: boolean;
  /** When true, only plants with priority > 0 get labels. */
  onlyActive: boolean;
};

function truncateLabel(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, Math.max(1, maxLen - 1))}…`;
}

function estimateLabelWidth(text: string, fontSize: number, isMobile: boolean): number {
  const cap = isMobile ? 92 : 112;
  const min = isMobile ? 44 : 52;
  return Math.min(cap, Math.max(min, text.length * fontSize * 0.52 + 12));
}

function estimateLabelHeight(fontSize: number): number {
  return fontSize + 8;
}

function rectsOverlap(a: Rect, b: Rect, gap = 3): boolean {
  return !(
    a.x1 + gap < b.x0 ||
    b.x1 + gap < a.x0 ||
    a.y1 + gap < b.y0 ||
    b.y1 + gap < a.y0
  );
}

function labelRect(
  plantX: number,
  plantY: number,
  candidate: LabelCandidate,
  width: number,
  height: number,
): Rect {
  const anchorX = plantX + candidate.offsetX;
  const anchorY = plantY + candidate.offsetY;
  let x0: number;
  if (candidate.align === "center") x0 = anchorX - width / 2;
  else if (candidate.align === "left") x0 = anchorX;
  else x0 = anchorX - width;
  return { x0, y0: anchorY, x1: x0 + width, y1: anchorY + height };
}

function overlapsPlantCircle(
  rect: Rect,
  cx: number,
  cy: number,
  radius: number,
  pad = 3,
): boolean {
  const closestX = Math.max(rect.x0, Math.min(cx, rect.x1));
  const closestY = Math.max(rect.y0, Math.min(cy, rect.y1));
  return Math.hypot(cx - closestX, cy - closestY) < radius + pad;
}

function candidates(radiusPx: number, height: number): LabelCandidate[] {
  const r = radiusPx;
  const h = height;
  return [
    { offsetX: 0, offsetY: r + 5, align: "center" },
    { offsetX: r + 10, offsetY: -h / 2, align: "left" },
    { offsetX: -r - 10, offsetY: -h / 2, align: "right" },
    { offsetX: 0, offsetY: -r - 5 - h, align: "center" },
    { offsetX: r + 10, offsetY: r + 2, align: "left" },
    { offsetX: -r - 10, offsetY: r + 2, align: "right" },
    { offsetX: 0, offsetY: r + 5 + h + 3, align: "center" },
    { offsetX: r + 14, offsetY: -h - 6, align: "left" },
    { offsetX: -r - 14, offsetY: -h - 6, align: "right" },
    { offsetX: 0, offsetY: r + 5 + (h + 3) * 2, align: "center" },
  ];
}

function labelTypography(
  plant: PlantLabelInput,
  options: LayoutCanvasPlantLabelsOptions,
): { text: string; fontSize: number; width: number; height: number } {
  const active = plant.priority >= 50;
  const fontSize =
    active && options.isMobile
      ? 11
      : active
        ? 12
        : options.isMobile
          ? 9
          : 10;
  const maxChars =
    options.isMobile && !active
      ? options.zoom < 1.05
        ? 11
        : 14
      : active
        ? 24
        : 18;
  const text = truncateLabel(plant.name, maxChars);
  const width = estimateLabelWidth(text, fontSize, options.isMobile);
  const height = estimateLabelHeight(fontSize);
  return { text, fontSize, width, height };
}

/** Greedy label placement with collision avoidance for canvas plant names. */
export function layoutCanvasPlantLabels(
  plants: PlantLabelInput[],
  options: LayoutCanvasPlantLabelsOptions,
): Map<string, PlantLabelLayout> {
  const result = new Map<string, PlantLabelLayout>();
  if (!plants.length) return result;

  const eligible = plants.filter((p) => {
    if (options.onlyActive) return p.priority > 0;
    if (!options.showAll) return p.priority > 0;
    return true;
  });

  const sorted = [...eligible].sort(
    (a, b) => b.priority - a.priority || a.y - b.y || a.x - b.x,
  );

  const placedRects: Rect[] = [];
  const obstacles = plants.map((p) => ({
    canvasId: p.canvasId,
    x: p.x,
    y: p.y,
    r: p.radiusPx,
  }));

  for (const plant of sorted) {
    const { text, fontSize, width, height } = labelTypography(plant, options);
    let chosen: { candidate: LabelCandidate; rect: Rect } | null = null;

    for (const candidate of candidates(plant.radiusPx, height)) {
      const rect = labelRect(plant.x, plant.y, candidate, width, height);
      if (placedRects.some((r) => rectsOverlap(r, rect))) continue;
      if (
        obstacles.some(
          (o) =>
            o.canvasId !== plant.canvasId &&
            overlapsPlantCircle(rect, o.x, o.y, o.r),
        )
      ) {
        continue;
      }
      chosen = { candidate, rect };
      break;
    }

    if (!chosen && plant.priority >= 50) {
      const fallback = candidates(plant.radiusPx, height)[0]!;
      chosen = {
        candidate: fallback,
        rect: labelRect(plant.x, plant.y, fallback, width, height),
      };
    }

    if (!chosen) {
      result.set(plant.canvasId, {
        show: false,
        offsetX: 0,
        offsetY: plant.radiusPx + 5,
        align: "center",
        text,
        fontSize,
        width,
        height,
      });
      continue;
    }

    placedRects.push(chosen.rect);
    result.set(plant.canvasId, {
      show: true,
      offsetX: chosen.candidate.offsetX,
      offsetY: chosen.candidate.offsetY,
      align: chosen.candidate.align,
      text,
      fontSize,
      width,
      height,
    });
  }

  for (const plant of plants) {
    if (!result.has(plant.canvasId)) {
      const { text, fontSize, width, height } = labelTypography(plant, options);
      result.set(plant.canvasId, {
        show: false,
        offsetX: 0,
        offsetY: plant.radiusPx + 5,
        align: "center",
        text,
        fontSize,
        width,
        height,
      });
    }
  }

  return result;
}
