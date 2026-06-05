import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Text, Group, Path, Ellipse } from "react-konva";
import { useDesignerStore } from "../../store/useDesignerStore";
import { hexToRgba } from "../../lib/canopy-colors";
import {
  buildSilhouetteLayout,
  RULER_WIDTH,
} from "../../lib/cross-section-layout";

function fitTransform(
  viewportW: number,
  viewportH: number,
  worldW: number,
  worldH: number,
): { scale: number; panX: number; panY: number } {
  const padX = RULER_WIDTH + 16;
  const padY = 12;
  const availW = Math.max(120, viewportW - padX - 16);
  const availH = Math.max(120, viewportH - padY - 12);
  const scale = Math.min(availW / worldW, availH / worldH, 1);
  const panX = padX + (availW - worldW * scale) / 2;
  const panY = padY + (availH - worldH * scale) / 2;
  return { scale, panX, panY };
}

export function CrossSectionView({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const hiddenLayers = useDesignerStore((s) => s.hiddenLayers);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const selectCanvasPlant = useDesignerStore((s) => s.selectCanvasPlant);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ scale: 1, panX: 0, panY: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const viewportH = height - 48;
  const layout = useMemo(
    () => buildSilhouetteLayout(canvasPlants, hiddenLayers),
    [canvasPlants, hiddenLayers],
  );

  const applyFit = useCallback(() => {
    if (!layout.items.length) return;
    setTransform(fitTransform(width, viewportH, layout.worldWidth, layout.worldHeight));
  }, [layout, width, viewportH]);

  useEffect(() => {
    applyFit();
  }, [applyFit]);

  const activeId = hoveredId ?? selectedCanvasPlantId;
  const active = layout.items.find((i) => i.plant.canvasId === activeId);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.07 : 0.07;
    setTransform((t) => ({
      ...t,
      scale: Math.min(2.5, Math.max(0.3, t.scale + delta)),
    }));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: transform.panX,
        panY: transform.panY,
      };
      setPanning(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform.panX, transform.panY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!panning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTransform((t) => ({
        ...t,
        panX: panStart.current.panX + dx,
        panY: panStart.current.panY + dy,
      }));
    },
    [panning],
  );

  const endPan = useCallback((e: React.PointerEvent) => {
    setPanning(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  if (!layout.items.length) {
    return (
      <div className="designer-cross-section" style={{ minHeight: height }}>
        <p className="designer-cross-section-empty">
          Add plants on the top-down canvas to see their height and canopy width
          here.
        </p>
      </div>
    );
  }

  const ftToY = (ft: number) =>
    layout.groundY - (ft / layout.maxHeightFt) * (layout.groundY - 24);

  return (
    <div
      className="designer-cross-section designer-cross-section--profile"
      style={{ minHeight: height }}
    >
      <header className="designer-cross-section-header">
        <div>
          <h2 className="designer-cross-section-title">Side profile</h2>
          <p className="designer-cross-section-sub">
            {layout.items.length} plants · drag to pan · scroll to zoom
          </p>
        </div>
        <div
          className="designer-cross-section-zoom"
          role="group"
          aria-label="Profile zoom"
        >
          <button
            type="button"
            className="designer-cross-section-zoom-btn"
            aria-label="Zoom out"
            onClick={() =>
              setTransform((t) => ({
                ...t,
                scale: Math.max(0.3, t.scale - 0.12),
              }))
            }
          >
            −
          </button>
          <button
            type="button"
            className="designer-cross-section-zoom-btn"
            onClick={applyFit}
          >
            Fit
          </button>
          <button
            type="button"
            className="designer-cross-section-zoom-btn"
            aria-label="Zoom in"
            onClick={() =>
              setTransform((t) => ({
                ...t,
                scale: Math.min(2.5, t.scale + 0.12),
              }))
            }
          >
            +
          </button>
        </div>
      </header>

      <div
        className={`designer-cross-section-viewport${panning ? " is-panning" : ""}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <Stage width={width} height={viewportH}>
          <Layer>
            <Rect
              x={0}
              y={0}
              width={width}
              height={viewportH}
              fill="#0a1810"
            />

            <Group
              x={transform.panX}
              y={transform.panY}
              scaleX={transform.scale}
              scaleY={transform.scale}
            >
              <Rect
                x={0}
                y={0}
                width={RULER_WIDTH}
                height={layout.worldHeight}
                fill="rgba(0,0,0,0.5)"
              />

              {layout.rulerTicks.map((ft) => (
                <Group key={ft}>
                  <Line
                    points={[
                      RULER_WIDTH - 6,
                      ftToY(ft),
                      layout.worldWidth,
                      ftToY(ft),
                    ]}
                    stroke={
                      ft === 0
                        ? "rgba(111,88,66,0.95)"
                        : "rgba(255,255,255,0.06)"
                    }
                    strokeWidth={ft === 0 ? 2 : 1}
                    dash={ft === 0 ? undefined : [4, 8]}
                  />
                  {ft > 0 && (
                    <Text
                      x={5}
                      y={ftToY(ft) - 5}
                      text={`${ft}′`}
                      fontSize={10}
                      fontStyle="600"
                      fill="#6d7f6b"
                    />
                  )}
                </Group>
              ))}

              <Rect
                x={RULER_WIDTH}
                y={0}
                width={layout.worldWidth - RULER_WIDTH}
                height={layout.groundY}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: layout.groundY }}
                fillLinearGradientColorStops={[
                  0,
                  "#0c1a12",
                  0.5,
                  "#163828",
                  1,
                  "#254636",
                ]}
              />

              <Rect
                x={0}
                y={layout.groundY}
                width={layout.worldWidth}
                height={layout.worldHeight - layout.groundY}
                fill="#b8a68a"
              />
              <Rect
                x={0}
                y={layout.groundY + 5}
                width={layout.worldWidth}
                height={layout.worldHeight - layout.groundY - 5}
                fill="#9a8770"
              />

              {layout.items.map((item) => {
                const { plant, screenX, colors, ill, geom } = item;
                const isActive = activeId === plant.canvasId;
                const { trunkW, trunkH, crownBlobs, spreadPx, topY, heightPx } =
                  geom;
                const illScale = Math.min(
                  spreadPx / ill.viewSize,
                  heightPx / ill.viewSize,
                );
                const illY = topY + heightPx * 0.38;

                return (
                  <Group
                    key={plant.canvasId}
                    x={screenX}
                    y={layout.groundY}
                    onMouseEnter={() => setHoveredId(plant.canvasId)}
                    onMouseLeave={() =>
                      setHoveredId((id) =>
                        id === plant.canvasId ? null : id,
                      )
                    }
                    onClick={() => selectCanvasPlant(plant.canvasId)}
                    onTap={() => selectCanvasPlant(plant.canvasId)}
                  >
                    <Ellipse
                      x={0}
                      y={3}
                      radiusX={spreadPx * 0.42}
                      radiusY={4}
                      fill="rgba(0,0,0,0.2)"
                    />

                    {trunkH > 3 && (
                      <Rect
                        x={-trunkW / 2}
                        y={-trunkH}
                        width={trunkW}
                        height={trunkH}
                        fill={hexToRgba(colors.stroke, 0.9)}
                        cornerRadius={1}
                      />
                    )}

                    {crownBlobs.map((blob, bi) => (
                      <Ellipse
                        key={bi}
                        x={blob.cx}
                        y={blob.cy}
                        radiusX={blob.rx}
                        radiusY={blob.ry}
                        fill={hexToRgba(colors.fill, isActive ? 0.5 : 0.34)}
                        stroke={colors.stroke}
                        strokeWidth={isActive ? 2 : 1.2}
                      />
                    ))}

                    <Group
                      x={0}
                      y={illY}
                      scaleX={illScale}
                      scaleY={illScale}
                      offsetX={ill.viewSize / 2}
                      offsetY={ill.viewSize / 2}
                      listening={false}
                    >
                      {ill.paths.map((d, pi) => (
                        <Path
                          key={pi}
                          data={d}
                          stroke={colors.stroke}
                          strokeWidth={isActive ? 2.2 : 1.6}
                          lineCap="round"
                          lineJoin="round"
                          fill={hexToRgba(colors.fill, isActive ? 0.55 : 0.4)}
                        />
                      ))}
                    </Group>

                    {isActive && (
                      <Group listening={false}>
                        <LabelTag
                          y={topY - 28}
                          text={plant.common_name}
                          sub={plant.canopy_layer}
                        />
                        <Line
                          points={[0, 0, 0, topY]}
                          stroke="#dce8dc"
                          strokeWidth={1}
                          dash={[3, 3]}
                        />
                        <Text
                          x={8}
                          y={topY / 2 - 6}
                          text={`${plant.mature_height_feet[1]}′`}
                          fontSize={11}
                          fontStyle="bold"
                          fill="#e8f0e9"
                        />
                        <Line
                          points={[
                            -spreadPx / 2,
                            -2,
                            spreadPx / 2,
                            -2,
                          ]}
                          stroke="#dce8dc"
                          strokeWidth={1}
                        />
                        <Line
                          points={[
                            -spreadPx / 2,
                            -2,
                            -spreadPx / 2 - 8,
                            -2,
                          ]}
                          stroke="#dce8dc"
                          strokeWidth={1}
                        />
                        <Line
                          points={[
                            spreadPx / 2,
                            -2,
                            spreadPx / 2 + 8,
                            -2,
                          ]}
                          stroke="#dce8dc"
                          strokeWidth={1}
                        />
                        <Text
                          x={-spreadPx / 2 - 8}
                          y={6}
                          text={`~${Math.round(plant.canvas_radius_feet * 2)}′ wide`}
                          fontSize={9}
                          fill="#c5d4c0"
                          align="center"
                          width={spreadPx + 16}
                        />
                        <Rect
                          x={-spreadPx / 2 - 6}
                          y={topY - 6}
                          width={spreadPx + 12}
                          height={heightPx + 10}
                          stroke="#dce8dc"
                          strokeWidth={1}
                          dash={[4, 4]}
                          cornerRadius={8}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}
            </Group>
          </Layer>
        </Stage>
      </div>

      <footer className="designer-cross-section-ground">
        <span>Ground level</span>
        {active ? (
          <span className="designer-cross-section-callout">
            <strong>{active.plant.common_name}</strong>
            {" · "}
            {active.plant.mature_height_feet[0]}–
            {active.plant.mature_height_feet[1]}′ tall · ~
            {Math.round(active.plant.canvas_radius_feet * 2)}′ wide ·{" "}
            {active.plant.canopy_layer}
          </span>
        ) : (
          <span className="designer-cross-section-hint">
            Hover or click a plant · syncs with top-down selection
          </span>
        )}
      </footer>
    </div>
  );
}

function LabelTag({
  y,
  text,
  sub,
}: {
  y: number;
  text: string;
  sub: string;
}) {
  const label = text.length > 22 ? `${text.slice(0, 20)}…` : text;
  const w = Math.max(72, label.length * 5.5 + 16);
  return (
    <Group y={y} offsetX={w / 2}>
      <Rect
        x={0}
        y={0}
        width={w}
        height={28}
        fill="rgba(13,31,20,0.92)"
        stroke="rgba(197,212,192,0.35)"
        strokeWidth={1}
        cornerRadius={6}
      />
      <Text
        x={8}
        y={5}
        text={label}
        fontSize={10}
        fontStyle="bold"
        fill="#e8f0e9"
        width={w - 16}
      />
      <Text
        x={8}
        y={16}
        text={sub}
        fontSize={8}
        fill="#8a9a88"
        width={w - 16}
      />
    </Group>
  );
}
