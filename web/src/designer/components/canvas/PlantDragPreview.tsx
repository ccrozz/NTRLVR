import type { PlantListItem } from "../../types";
import {
  canopyColor,
  CENTER_DOT_RATIO,
  hexToRgba,
} from "../../lib/canopy-colors";
import {
  CANVAS_MAX_CENTER_DOT_PX,
  radiusPx,
} from "../../lib/canvas-utils";
import { getCategoryIllustration } from "../../lib/plant-illustrations";

type Props = {
  plant: PlantListItem;
  /** Canvas zoom so preview footprint matches placed plant size. */
  zoom: number;
};

export function PlantDragPreview({ plant, zoom }: Props) {
  const colors = canopyColor(plant.canopy_layer);
  const radiusFeet = plant.canvas_radius_feet ?? 3;
  const r = radiusPx(radiusFeet, zoom);
  const isVine = plant.canopy_layer === "Vine";
  const dotRatio = CENTER_DOT_RATIO[plant.canopy_layer];
  const dotR = Math.min(
    CANVAS_MAX_CENTER_DOT_PX,
    Math.max(4, r * dotRatio),
  );
  const ill = getCategoryIllustration(plant.category);
  const ringW = isVine ? r * 2 : r * 2;
  const ringH = isVine ? r * 1.1 : r * 2;
  const stageW = Math.max(ringW + 24, 88);
  const stageH = ringH + 44;

  return (
    <div
      className="designer-drag-plant-preview"
      style={{ width: stageW, height: stageH }}
    >
      <div
        className="designer-drag-plant-preview__rings"
        style={{ width: stageW, height: ringH + 8 }}
      >
        {isVine ? (
          <div
            className="designer-drag-plant-preview__vine"
            style={{
              width: ringW,
              height: ringH,
              borderColor: hexToRgba(colors.stroke, 0.85),
              background: hexToRgba(colors.fill, 0.14),
            }}
          />
        ) : (
          <div
            className="designer-drag-plant-preview__canopy"
            style={{
              width: ringW,
              height: ringH,
              borderColor: hexToRgba(colors.stroke, 0.8),
              background: `radial-gradient(circle at 50% 50%, ${hexToRgba(colors.fill, 0.32)} 0%, ${hexToRgba(colors.fill, 0.08)} 55%, transparent 72%)`,
            }}
          />
        )}
        {dotRatio > 0 && (
          <div
            className="designer-drag-plant-preview__dot"
            style={{
              width: dotR * 2,
              height: dotR * 2,
              background: hexToRgba(colors.fill, 0.55),
              borderColor: hexToRgba(colors.stroke, 0.75),
            }}
          >
            <svg
              viewBox={`0 0 ${ill.viewSize} ${ill.viewSize}`}
              className="designer-drag-plant-preview__icon"
              aria-hidden
            >
              {ill.paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>
        )}
      </div>
      <p className="designer-drag-plant-preview__name">{plant.common_name}</p>
      <p className="designer-drag-plant-preview__meta">
        {radiusFeet}′ spread · {plant.canopy_layer}
      </p>
    </div>
  );
}
