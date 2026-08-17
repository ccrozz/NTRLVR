import { Line } from "react-konva";
import { PX_PER_FOOT } from "../../lib/canvas-utils";
import type { StageViewBounds } from "../../lib/viewport-bounds";

const MAJOR_EVERY_FT = 5;

type ScaleGridLayerProps = {
  bounds: StageViewBounds;
  visible: boolean;
};

/** Grid lines for the visible world region (extends seamlessly when panning). */
export function ScaleGridLayer({ bounds, visible }: ScaleGridLayerProps) {
  if (!visible) return null;

  const x0 = bounds.x;
  const y0 = bounds.y;
  const x1 = bounds.x + bounds.width;
  const y1 = bounds.y + bounds.height;

  const ftStartX = Math.max(0, Math.floor(x0 / PX_PER_FOOT));
  const ftEndX = Math.ceil(x1 / PX_PER_FOOT);
  const ftStartY = Math.max(0, Math.floor(y0 / PX_PER_FOOT));
  const ftEndY = Math.ceil(y1 / PX_PER_FOOT);

  const lines: { points: number[]; major: boolean }[] = [];

  for (let ft = ftStartX; ft <= ftEndX; ft++) {
    const x = ft * PX_PER_FOOT;
    lines.push({
      points: [x, y0, x, y1],
      major: ft % MAJOR_EVERY_FT === 0,
    });
  }

  for (let ft = ftStartY; ft <= ftEndY; ft++) {
    const y = ft * PX_PER_FOOT;
    lines.push({
      points: [x0, y, x1, y],
      major: ft % MAJOR_EVERY_FT === 0,
    });
  }

  return (
    <>
      {lines.map((ln, i) => (
        <Line
          key={`g-${i}`}
          points={ln.points}
          stroke={
            ln.major
              ? "rgba(88, 111, 82, 0.24)"
              : "rgba(94, 108, 88, 0.1)"
          }
          strokeWidth={ln.major ? 1 : 0.65}
          listening={false}
        />
      ))}
    </>
  );
}
