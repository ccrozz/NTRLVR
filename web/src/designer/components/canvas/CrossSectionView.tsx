import { useMemo } from "react";
import { Stage, Layer, Rect, Line, Text, Group, Path } from "react-konva";
import { useDesignerStore } from "../../store/useDesignerStore";
import { canopyColor, hexToRgba } from "../../lib/canopy-colors";
import { getCategoryIllustration } from "../../lib/plant-illustrations";
import { PX_PER_FOOT } from "../../lib/canvas-utils";

const GROUND_Y_RATIO = 0.88;
const MAX_HEIGHT_FT = 45;

export function CrossSectionView({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const hiddenLayers = useDesignerStore((s) => s.hiddenLayers);

  const layout = useMemo(() => {
    if (!canvasPlants.length) {
      return { plants: [], groundY: height * GROUND_Y_RATIO, scaleX: 1, scaleY: 1 };
    }
    const xs = canvasPlants.map((p) => p.x);
    const minX = Math.min(...xs) - 80;
    const maxX = Math.max(...xs) + 80;
    const spanX = Math.max(maxX - minX, 200);
    const groundY = height * GROUND_Y_RATIO;
    const scaleX = (width - 80) / spanX;
    const scaleY = (groundY - 48) / MAX_HEIGHT_FT;

    const plants = canvasPlants
      .filter((p) => !hiddenLayers.includes(p.canopy_layer))
      .map((p) => {
        const maxH = p.mature_height_feet[1] ?? 10;
        const colors = canopyColor(p.canopy_layer);
        const ill = getCategoryIllustration(p.category);
        return {
          ...p,
          screenX: 40 + (p.x - minX) * scaleX,
          screenY: groundY - maxH * scaleY,
          heightPx: maxH * scaleY,
          widthPx: Math.max(24, p.canvas_radius_feet * PX_PER_FOOT * 0.35),
          colors,
          ill,
        };
      })
      .sort((a, b) => a.screenX - b.screenX);

    return { plants, groundY, scaleX, scaleY, minX };
  }, [canvasPlants, hiddenLayers, width, height]);

  return (
    <div className="designer-cross-section-wrap">
      <Stage width={width} height={height} listening={false}>
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={layout.groundY}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: layout.groundY }}
            fillLinearGradientColorStops={[
              0,
              "#0d1f14",
              0.45,
              "#1a4731",
              1,
              "#3d5c34",
            ]}
          />
          <Rect
            x={0}
            y={layout.groundY}
            width={width}
            height={height - layout.groundY}
            fill="#c9b99a"
          />
          <Line
            points={[0, layout.groundY, width, layout.groundY]}
            stroke="#6f5842"
            strokeWidth={3}
          />
          <Text
            x={12}
            y={layout.groundY + 8}
            text="Ground level"
            fontSize={11}
            fill="#4a3d30"
          />
          <Text
            x={12}
            y={16}
            text="Cross section — vertical stacking (read-only)"
            fontSize={13}
            fill="#c5d4c0"
          />

          {layout.plants.map((p) => (
            <Group
              key={p.canvasId}
              x={p.screenX}
              y={p.screenY}
              listening={false}
            >
              <Rect
                x={-2}
                y={0}
                width={4}
                height={p.heightPx}
                fill={hexToRgba(p.colors.fill, 0.5)}
              />
              <Group
                scale={{
                  x: p.widthPx / p.ill.viewSize,
                  y: p.heightPx / p.ill.viewSize,
                }}
                y={p.heightPx * 0.1}
                offsetX={p.ill.viewSize / 2}
                listening={false}
              >
                {p.ill.paths.map((d, i) => (
                  <Path
                    key={i}
                    data={d}
                    stroke={p.colors.stroke}
                    strokeWidth={2.5}
                    lineCap="round"
                    lineJoin="round"
                    fill={hexToRgba(p.colors.fill, 0.25)}
                  />
                ))}
              </Group>
              <Text
                y={p.heightPx + 6}
                text={p.common_name}
                fontSize={10}
                fill="#e8f0e9"
                align="center"
                width={120}
                offsetX={60}
              />
              <Text
                y={-14}
                text={`${p.mature_height_feet[1]}′ · ${p.canopy_layer}`}
                fontSize={9}
                fill="#8a9a88"
                align="center"
                width={100}
                offsetX={50}
              />
            </Group>
          ))}

          {layout.plants.length === 0 && (
            <Text
              x={width / 2 - 120}
              y={height / 2}
              width={240}
              text="Place plants on the canvas to see their vertical stack."
              fontSize={14}
              fill="#8a9a88"
              align="center"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
