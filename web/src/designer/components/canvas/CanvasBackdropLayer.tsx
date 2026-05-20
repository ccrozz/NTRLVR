import { Rect } from "react-konva";
import type { StageViewBounds } from "../../lib/viewport-bounds";

type Props = {
  bounds: StageViewBounds;
};

/** Soft ground fill that extends with pan — no hard black void. */
export function CanvasBackdropLayer({ bounds }: Props) {
  const pad = Math.max(bounds.width, bounds.height) * 0.35;
  return (
    <>
      <Rect
        x={bounds.x - pad}
        y={bounds.y - pad}
        width={bounds.width + pad * 2}
        height={bounds.height + pad * 2}
        fill="rgba(0, 0, 0, 0.18)"
        listening={false}
      />
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fillRadialGradientStartPoint={{
          x: bounds.width * 0.5,
          y: bounds.height * 0.35,
        }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{
          x: bounds.width * 0.5,
          y: bounds.height * 0.5,
        }}
        fillRadialGradientEndRadius={Math.max(bounds.width, bounds.height) * 0.85}
        fillRadialGradientColorStops={[
          0,
          "rgba(0, 0, 0, 0.08)",
          0.5,
          "rgba(0, 0, 0, 0.14)",
          1,
          "rgba(0, 0, 0, 0.22)",
        ]}
        listening={false}
      />
    </>
  );
}
