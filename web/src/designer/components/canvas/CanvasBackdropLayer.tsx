import { Rect } from "react-konva";
import type { StageViewBounds } from "../../lib/viewport-bounds";

type Props = {
  bounds: StageViewBounds;
};

/** Warm drafting-paper ground that extends seamlessly while panning. */
export function CanvasBackdropLayer({ bounds }: Props) {
  const pad = Math.max(bounds.width, bounds.height) * 0.35;
  return (
    <>
      <Rect
        x={bounds.x - pad}
        y={bounds.y - pad}
        width={bounds.width + pad * 2}
        height={bounds.height + pad * 2}
        fill="#f0eee6"
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
          "rgba(255, 255, 252, 0.7)",
          0.5,
          "rgba(248, 247, 240, 0.42)",
          1,
          "rgba(229, 229, 218, 0.35)",
        ]}
        listening={false}
      />
    </>
  );
}
