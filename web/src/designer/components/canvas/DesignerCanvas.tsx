import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Stage, Layer, Circle, Text, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { useDesignerStore } from "../../store/useDesignerStore";
import { canopyColor } from "../../lib/canopy-colors";
import { radiusPx } from "../../lib/canvas-utils";
import { plantInsideZones } from "../../lib/zone-geometry";
import { ZoneLayer } from "./ZoneLayer";
import { ScaleGridLayer } from "./ScaleGridLayer";
import { DrawMeasureOverlay } from "./DrawMeasureOverlay";

export type DesignerCanvasHandle = {
  exportPng: () => string | null;
};

function PlantOnCanvas({
  cp,
  selected,
  outsideZone,
  onSelect,
  onDragEnd,
}: {
  cp: {
    canvasId: string;
    x: number;
    y: number;
    canvas_radius_feet: number;
    image_url: string | null;
    common_name: string;
    canopy_layer: import("../../../types").CanopyLayer;
    is_invasive_in_florida: boolean;
  };
  selected: boolean;
  outsideZone: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const colors = canopyColor(cp.canopy_layer);
  const r = radiusPx(cp.canvas_radius_feet, 1);
  const warnStroke = outsideZone ? "#e8a040" : colors.stroke;
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!cp.image_url) {
      setImg(null);
      return;
    }
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = cp.image_url;
  }, [cp.image_url]);

  return (
    <>
      <Circle
        x={cp.x}
        y={cp.y}
        radius={r}
        fill={img ? "#1a2820" : colors.fill}
        opacity={img ? 1 : 0.45}
        stroke={warnStroke}
        strokeWidth={selected ? 3 : 2}
        dash={outsideZone ? [6, 4] : undefined}
        shadowColor={selected ? "#7ec850" : outsideZone ? "#e8a040" : "transparent"}
        shadowBlur={selected || outsideZone ? 14 : 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      />
      {img && (
        <KonvaImage
          image={img}
          x={cp.x - r}
          y={cp.y - r}
          width={r * 2}
          height={r * 2}
          cornerRadius={r}
          listening={false}
        />
      )}
      {!img && (
        <Text
          x={cp.x}
          y={cp.y}
          text={cp.common_name.charAt(0).toUpperCase()}
          fontSize={Math.min(r, 28)}
          fill="#fff"
          align="center"
          offsetX={r * 0.2}
          offsetY={r * 0.35}
          listening={false}
        />
      )}
      <Text
        x={cp.x}
        y={cp.y + r + 12}
        text={cp.common_name}
        fontSize={11}
        fill="#e8f0e9"
        align="center"
        width={Math.max(80, r * 2.5)}
        offsetX={Math.max(40, r * 1.25)}
        listening={false}
      />
      {outsideZone && (
        <Text
          x={cp.x + r - 10}
          y={cp.y - r + 2}
          text="⚠️"
          fontSize={14}
          listening={false}
        />
      )}
      {cp.is_invasive_in_florida && !outsideZone && (
        <Text
          x={cp.x + r - 10}
          y={cp.y - r + 2}
          text="⚠️"
          fontSize={14}
          listening={false}
        />
      )}
    </>
  );
}

export const DesignerCanvas = forwardRef<DesignerCanvasHandle>(
  function DesignerCanvas(_props, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const [size, setSize] = useState({ w: 1, h: 1 });

    const canvasPlants = useDesignerStore((s) => s.canvasPlants);
    const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
    const zoom = useDesignerStore((s) => s.zoom);
    const stagePos = useDesignerStore((s) => s.stagePos);
    const backgroundImageUrl = useDesignerStore((s) => s.backgroundImageUrl);
    const canvasMode = useDesignerStore((s) => s.canvasMode);
    const showRuler = useDesignerStore((s) => s.showRuler);
    const selectCanvasPlant = useDesignerStore((s) => s.selectCanvasPlant);
    const movePlant = useDesignerStore((s) => s.movePlant);
    const setStagePos = useDesignerStore((s) => s.setStagePos);
    const pushHistory = useDesignerStore((s) => s.pushHistory);
    const zones = useDesignerStore((s) => s.zones);
    const activeZoneId = useDesignerStore((s) => s.activeZoneId);
    const workspaceTool = useDesignerStore((s) => s.workspaceTool);
    const drawPoints = useDesignerStore((s) => s.drawPoints);
    const addDrawPoint = useDesignerStore((s) => s.addDrawPoint);
    const zoneDragOrigin = useDesignerStore((s) => s.zoneDragOrigin);

    const [drawCursor, setDrawCursor] = useState<{ x: number; y: number } | null>(
      null,
    );

    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

    const stageW = size.w / zoom;
    const stageH = size.h / zoom;
    const showScaleGrid = showRuler || workspaceTool === "draw-zone";

    function pointerInStage(): { x: number; y: number } | null {
      const stage = stageRef.current;
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      return {
        x: (pos.x - stagePos.x) / zoom,
        y: (pos.y - stagePos.y) / zoom,
      };
    }

    useImperativeHandle(ref, () => ({
      exportPng: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null,
    }));

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        setSize({ w: el.clientWidth, h: el.clientHeight });
      });
      ro.observe(el);
      setSize({ w: el.clientWidth, h: el.clientHeight });
      return () => ro.disconnect();
    }, []);

    const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
      if (!backgroundImageUrl || canvasMode !== "photo") {
        setBgImg(null);
        return;
      }
      const el = new window.Image();
      el.onload = () => setBgImg(el);
      el.src = backgroundImageUrl;
    }, [backgroundImageUrl, canvasMode]);

    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;
      stage.position(stagePos);
      stage.scale({ x: zoom, y: zoom });
      stage.batchDraw();
    }, [stagePos, zoom]);

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          wrapRef.current = node;
        }}
        className={`designer-canvas-wrap${workspaceTool === "draw-zone" ? " is-draw-mode" : ""}`}
        style={{
          outline: isOver ? "2px solid var(--color-accent)" : undefined,
        }}
      >
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePos.x}
          y={stagePos.y}
          draggable={workspaceTool !== "draw-zone" && !zoneDragOrigin}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onMouseMove={() => {
            if (workspaceTool !== "draw-zone") {
              setDrawCursor(null);
              return;
            }
            setDrawCursor(pointerInStage());
          }}
          onMouseLeave={() => setDrawCursor(null)}
          onClick={(e) => {
            if (e.target !== stageRef.current) return;
            const pt = pointerInStage();
            if (!pt) return;
            if (workspaceTool === "draw-zone") {
              addDrawPoint(pt.x, pt.y);
              return;
            }
            selectCanvasPlant(null);
            useDesignerStore.getState().selectSidebarPlant(null);
          }}
        >
          <Layer>
            {bgImg && (
              <KonvaImage
                image={bgImg}
                x={0}
                y={0}
                width={stageW}
                height={stageH}
                opacity={0.85}
                listening={false}
              />
            )}
            <ScaleGridLayer
              width={stageW}
              height={stageH}
              visible={showScaleGrid}
            />
            <ZoneLayer
              zones={zones}
              activeZoneId={activeZoneId}
              drawPoints={drawPoints}
              workspaceTool={workspaceTool}
            />
            {workspaceTool === "draw-zone" && (
              <DrawMeasureOverlay points={drawPoints} cursor={drawCursor} />
            )}
          </Layer>
          <Layer>
            {canvasPlants.map((cp) => (
              <PlantOnCanvas
                key={cp.canvasId}
                cp={cp}
                selected={selectedCanvasPlantId === cp.canvasId}
                outsideZone={
                  zones.length > 0 && !plantInsideZones(cp.x, cp.y, zones)
                }
                onSelect={() => {
                  selectCanvasPlant(cp.canvasId);
                  useDesignerStore.getState().selectSidebarPlant(cp.plantId);
                }}
                onDragEnd={(x, y) => {
                  pushHistory();
                  movePlant(cp.canvasId, x, y);
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  },
);
