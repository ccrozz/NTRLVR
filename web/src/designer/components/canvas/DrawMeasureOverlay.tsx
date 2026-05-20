import { Circle, Line, Text } from "react-konva";
import { PX_PER_FOOT } from "../../lib/canvas-utils";

function distFeet(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy) / PX_PER_FOOT;
}

function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

type DrawMeasureOverlayProps = {
  points: { x: number; y: number }[];
  cursor: { x: number; y: number } | null;
  /** Rubber-band to cursor only while pointer is over the canvas. */
  showRubberBand: boolean;
};

export function DrawMeasureOverlay({
  points,
  cursor,
  showRubberBand,
}: DrawMeasureOverlayProps) {
  if (points.length === 0 && !cursor) return null;

  const segments: { a: { x: number; y: number }; b: { x: number; y: number } }[] =
    [];
  for (let i = 1; i < points.length; i++) {
    segments.push({ a: points[i - 1]!, b: points[i]! });
  }
  if (showRubberBand && cursor && points.length > 0) {
    segments.push({ a: points[points.length - 1]!, b: cursor });
  }
  if (points.length >= 3) {
    segments.push({ a: points[points.length - 1]!, b: points[0]! });
  }

  let totalFt = 0;
  for (const seg of segments) {
    totalFt += distFeet(seg.a, seg.b);
  }

  const previewFlat =
    showRubberBand && cursor && points.length > 0
      ? [...points.flatMap((p) => [p.x, p.y]), cursor.x, cursor.y]
      : null;

  return (
    <>
      {segments.map((seg, i) => {
        const ft = distFeet(seg.a, seg.b);
        const mid = midpoint(seg.a, seg.b);
        return (
          <Text
            key={`seg-${i}`}
            x={mid.x - 18}
            y={mid.y - 18}
            text={`${ft.toFixed(1)} ft`}
            fontSize={11}
            fontStyle="bold"
            fill="#e8f0e9"
            padding={3}
            listening={false}
          />
        );
      })}

      {previewFlat && (
        <Line
          points={previewFlat}
          stroke="#7ec850"
          strokeWidth={2}
          dash={[8, 6]}
          opacity={0.85}
          listening={false}
        />
      )}

      {showRubberBand && cursor && points.length > 0 && (
        <Circle
          x={cursor.x}
          y={cursor.y}
          radius={4}
          fill="rgba(126, 200, 80, 0.6)"
          stroke="#7ec850"
          strokeWidth={1}
          listening={false}
        />
      )}

      {points.length >= 1 && (
        <Text
          x={points[0]!.x + 8}
          y={points[0]!.y - 28}
          text={
            points.length < 3
              ? `Edge total: ${totalFt.toFixed(1)} ft (need ${3 - points.length} more point${3 - points.length === 1 ? "" : "s"})`
              : `Perimeter ≈ ${totalFt.toFixed(1)} ft`
          }
          fontSize={11}
          fill="#7ec850"
          listening={false}
        />
      )}

      {showRubberBand && points.length >= 2 && cursor && (
        <Text
          x={cursor.x + 10}
          y={cursor.y + 10}
          text={`${distFeet(points[points.length - 1]!, cursor).toFixed(1)} ft`}
          fontSize={10}
          fill="#a8c4a8"
          listening={false}
        />
      )}
    </>
  );
}
