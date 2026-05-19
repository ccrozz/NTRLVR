import { Line, Rect, Text } from "react-konva";
import { PX_PER_FOOT } from "../../lib/canvas-utils";

const MAJOR_EVERY_FT = 5;
const SCALE_BAR_FT = 10;

type ScaleGridLayerProps = {
  width: number;
  height: number;
  visible: boolean;
};

export function ScaleGridLayer({ width, height, visible }: ScaleGridLayerProps) {
  if (!visible || width < 1 || height < 1) return null;

  const maxFtX = Math.ceil(width / PX_PER_FOOT) + 1;
  const maxFtY = Math.ceil(height / PX_PER_FOOT) + 1;

  const lines: { points: number[]; major: boolean }[] = [];

  for (let ft = 0; ft <= maxFtX; ft++) {
    const x = ft * PX_PER_FOOT;
    if (x > width) break;
    lines.push({
      points: [x, 0, x, height],
      major: ft % MAJOR_EVERY_FT === 0,
    });
  }

  for (let ft = 0; ft <= maxFtY; ft++) {
    const y = ft * PX_PER_FOOT;
    if (y > height) break;
    lines.push({
      points: [0, y, width, y],
      major: ft % MAJOR_EVERY_FT === 0,
    });
  }

  const labels: { x: number; y: number; text: string }[] = [];
  for (let ft = MAJOR_EVERY_FT; ft <= maxFtX; ft += MAJOR_EVERY_FT) {
    const x = ft * PX_PER_FOOT;
    if (x > width - 8) continue;
    labels.push({ x: x + 3, y: 6, text: `${ft}′` });
  }
  for (let ft = MAJOR_EVERY_FT; ft <= maxFtY; ft += MAJOR_EVERY_FT) {
    const y = ft * PX_PER_FOOT;
    if (y > height - 14) continue;
    labels.push({ x: 6, y: y + 3, text: `${ft}′` });
  }

  const barW = SCALE_BAR_FT * PX_PER_FOOT;
  const barX = 16;
  const barY = height - 36;

  return (
    <>
      {lines.map((ln, i) => (
        <Line
          key={`g-${i}`}
          points={ln.points}
          stroke={
            ln.major
              ? "rgba(126, 200, 80, 0.35)"
              : "rgba(126, 200, 80, 0.12)"
          }
          strokeWidth={ln.major ? 1 : 0.5}
          listening={false}
        />
      ))}
      {labels.map((lb, i) => (
        <Text
          key={`l-${i}`}
          x={lb.x}
          y={lb.y}
          text={lb.text}
          fontSize={10}
          fill="rgba(168, 196, 168, 0.9)"
          listening={false}
        />
      ))}
      <Rect
        x={barX}
        y={barY}
        width={barW}
        height={6}
        fill="rgba(126, 200, 80, 0.5)"
        stroke="#7ec850"
        strokeWidth={1}
        listening={false}
      />
      <Rect
        x={barX}
        y={barY - 2}
        width={2}
        height={10}
        fill="#7ec850"
        listening={false}
      />
      <Rect
        x={barX + barW - 2}
        y={barY - 2}
        width={2}
        height={10}
        fill="#7ec850"
        listening={false}
      />
      <Text
        x={barX}
        y={barY + 10}
        text={`${SCALE_BAR_FT} ft`}
        fontSize={11}
        fontStyle="bold"
        fill="#a8c4a8"
        listening={false}
      />
      <Text
        x={barX + barW + 8}
        y={barY - 1}
        text="1 square = 1 ft"
        fontSize={10}
        fill="rgba(168, 196, 168, 0.75)"
        listening={false}
      />
    </>
  );
}
