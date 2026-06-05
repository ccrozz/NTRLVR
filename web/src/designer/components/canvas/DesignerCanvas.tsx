import {
  useRef,
  useEffect,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useDroppable } from "@dnd-kit/core";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { useDesignerStore } from "../../store/useDesignerStore";
import { CANOPY_LAYER_ORDER } from "../../lib/canopy-colors";
import { radiusPx } from "../../lib/canvas-utils";
import { plantOutsideOwnedZone } from "../../lib/zone-geometry";
import { ZoneLayer } from "./ZoneLayer";
import { ZoneResizeHandles } from "./ZoneResizeHandles";
import { CanvasBackdropLayer } from "./CanvasBackdropLayer";
import { ScaleGridLayer } from "./ScaleGridLayer";
import { CanvasEdgeRulers } from "./CanvasEdgeRulers";
import {
  visibleStageBounds,
  contentLayoutBounds,
  stagePosToCenterBounds,
} from "../../lib/viewport-bounds";
import { DrawMeasureOverlay } from "./DrawMeasureOverlay";
import { PlantCircle } from "./PlantCircle";
import { CompanionSuggestions } from "./CompanionSuggestions";
import { CrossSectionView } from "./CrossSectionView";
import { pointerHitsCanvasPlant } from "../../lib/canvas-plant-hit";
import { bindCanvasTouchViewport } from "../../lib/canvas-touch-viewport";
import { handleCanvasWheel } from "../../lib/canvas-wheel";
import { mobileGardenFitZoom } from "../../lib/canvas-mobile-fit";
import { MobileCanvasZoomControls } from "./MobileCanvasZoomControls";
import { DesignerMobileWelcome } from "./DesignerMobileWelcome";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import type { CanvasPlant } from "../../types";

export type DesignerCanvasHandle = {
  exportPng: () => string | null;
  centerOnContent: () => void;
};

/** Permaculture z-order, then smaller radii within a layer; hover/selection on top. */
export function sortPlantsForRender(
  plants: CanvasPlant[],
  hoveredId: string | null,
  selectedId: string | null,
): CanvasPlant[] {
  const sorted = [...plants].sort((a, b) => {
    const layerDiff =
      CANOPY_LAYER_ORDER[a.canopy_layer] - CANOPY_LAYER_ORDER[b.canopy_layer];
    if (layerDiff !== 0) return layerDiff;
    return (
      radiusPx(a.canvas_radius_feet, 1) - radiusPx(b.canvas_radius_feet, 1)
    );
  });

  const bringToFront = (id: string | null) => {
    if (!id) return;
    const idx = sorted.findIndex((p) => p.canvasId === id);
    if (idx < 0) return;
    const [plant] = sorted.splice(idx, 1);
    sorted.push(plant);
  };

  bringToFront(selectedId);
  bringToFront(hoveredId);
  return sorted;
}

export const DesignerCanvas = forwardRef<DesignerCanvasHandle>(
  function DesignerCanvas(_props, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const [size, setSize] = useState({ w: 1, h: 1 });

    const canvasPlants = useDesignerStore((s) => s.canvasPlants);
    const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
    const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
    const detailPanelOpen = Boolean(selectedPlantId);
    const openCanvasPlantProfile = useDesignerStore(
      (s) => s.openCanvasPlantProfile,
    );
    const hiddenLayers = useDesignerStore((s) => s.hiddenLayers);
    const canvasView = useDesignerStore((s) => s.canvasView);
    const zoom = useDesignerStore((s) => s.zoom);
    const stagePos = useDesignerStore((s) => s.stagePos);
    const backgroundImageUrl = useDesignerStore((s) => s.backgroundImageUrl);
    const canvasMode = useDesignerStore((s) => s.canvasMode);
    const showRuler = useDesignerStore((s) => s.showRuler);
    const selectCanvasPlant = useDesignerStore((s) => s.selectCanvasPlant);
    const closeDetailPanel = useDesignerStore((s) => s.closeDetailPanel);
    const placementFlashCanvasId = useDesignerStore(
      (s) => s.placementFlashCanvasId,
    );
    const compactCanvasVisuals = useDesignerStore((s) => s.compactCanvasVisuals);
    const movePlant = useDesignerStore((s) => s.movePlant);
    const setZoom = useDesignerStore((s) => s.setZoom);
    const setStagePos = useDesignerStore((s) => s.setStagePos);
    const canvasFitTick = useDesignerStore((s) => s.canvasFitTick);
    const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
    const mobileToolsOpen = useDesignerStore((s) => s.mobileToolsOpen);
    const pushHistory = useDesignerStore((s) => s.pushHistory);
    const zones = useDesignerStore((s) => s.zones);
    const activeZoneId = useDesignerStore((s) => s.activeZoneId);
    const workspaceTool = useDesignerStore((s) => s.workspaceTool);
    const drawPoints = useDesignerStore((s) => s.drawPoints);
    const drawCursor = useDesignerStore((s) => s.drawCursor);
    const setDrawCursor = useDesignerStore((s) => s.setDrawCursor);
    const addDrawPoint = useDesignerStore((s) => s.addDrawPoint);
    const zoneDragOrigin = useDesignerStore((s) => s.zoneDragOrigin);

    const [hoveredCanvasPlantId, setHoveredCanvasPlantId] = useState<
      string | null
    >(null);

    const plantsToRender = useMemo(
      () =>
        sortPlantsForRender(
          canvasPlants,
          hoveredCanvasPlantId,
          selectedCanvasPlantId,
        ),
      [canvasPlants, hoveredCanvasPlantId, selectedCanvasPlantId],
    );

    const selectedPlant = useMemo(
      () =>
        canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId) ?? null,
      [canvasPlants, selectedCanvasPlantId],
    );

    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

    const showScaleGrid = showRuler || workspaceTool === "draw-zone";

    const gridBounds = useMemo(
      () => visibleStageBounds(size.w, size.h, stagePos, zoom, 40),
      [size.w, size.h, stagePos.x, stagePos.y, zoom],
    );
    const backdropBounds = useMemo(
      () => visibleStageBounds(size.w, size.h, stagePos, zoom, 100),
      [size.w, size.h, stagePos.x, stagePos.y, zoom],
    );

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

    useImperativeHandle(
      ref,
      () => ({
        exportPng: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null,
        centerOnContent: () => {
          const layout = contentLayoutBounds(zones, canvasPlants, 12);
          setStagePos(stagePosToCenterBounds(layout, size.w, size.h, zoom));
        },
      }),
      [zones, canvasPlants, size.w, size.h, zoom, setStagePos],
    );

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

    useEffect(() => {
      const root = wrapRef.current;
      if (!root) return;

      const onWheel = (e: WheelEvent) => {
        const s = useDesignerStore.getState();
        handleCanvasWheel(
          e,
          root,
          { zoom: s.zoom, stagePos: s.stagePos },
          ({ zoom: nextZoom, stagePos: nextPos }) => {
            setZoom(nextZoom);
            setStagePos(nextPos);
          },
        );
      };

      root.addEventListener("wheel", onWheel, { passive: false });
      return () => root.removeEventListener("wheel", onWheel);
    }, [canvasView, setZoom, setStagePos]);

    useEffect(() => {
      const root = wrapRef.current;
      if (!root || canvasView !== "top-down") return;
      return bindCanvasTouchViewport(
        root,
        () => {
          const s = useDesignerStore.getState();
          return { zoom: s.zoom, stagePos: s.stagePos };
        },
        ({ zoom: nextZoom, stagePos: nextPos }) => {
          setZoom(nextZoom);
          setStagePos(nextPos);
        },
        {
          shouldIgnorePointer: (e) => {
            const stage = stageRef.current;
            if (!stage) return false;
            return pointerHitsCanvasPlant(stage, root, e.clientX, e.clientY);
          },
        },
      );
    }, [canvasView, setZoom, setStagePos]);

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

    useEffect(() => {
      if (!canvasFitTick || canvasView !== "top-down") return;
      const { zones: fitZones, canvasPlants: fitPlants, zoom: currentZoom } =
        useDesignerStore.getState();
      const layout = contentLayoutBounds(fitZones, fitPlants, 12);
      let fitZoom = currentZoom;
      if (
        isMobile &&
        layout.width > 0 &&
        layout.height > 0 &&
        size.w > 0 &&
        size.h > 0
      ) {
        fitZoom = mobileGardenFitZoom(
          layout.width,
          layout.height,
          size.w,
          size.h,
        );
        setZoom(fitZoom);
      }
      setStagePos(stagePosToCenterBounds(layout, size.w, size.h, fitZoom));
    }, [canvasFitTick, canvasView, isMobile, size.w, size.h, setZoom, setStagePos]);

    if (canvasView === "cross-section") {
      return (
        <div
          ref={(node) => {
            setNodeRef(node);
            wrapRef.current = node;
          }}
          className="designer-canvas-wrap designer-canvas-wrap--cross-section"
        >
          <CrossSectionView width={size.w} height={size.h} />
        </div>
      );
    }

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
        <CanvasEdgeRulers
          viewportW={size.w}
          viewportH={size.h}
          stagePos={stagePos}
          zoom={zoom}
          visible={showScaleGrid}
        />
        {isMobile && !mobileToolsOpen && <MobileCanvasZoomControls />}
        {isMobile && <DesignerMobileWelcome />}
        {showScaleGrid && (
          <div className="designer-canvas-scale-legend" aria-hidden>
            <span className="designer-canvas-scale-bar" />
            <span className="designer-canvas-scale-label">10 ft</span>
            <span className="designer-canvas-scale-note">1 square = 1 ft</span>
          </div>
        )}
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePos.x}
          y={stagePos.y}
          draggable={
            !isMobile &&
            workspaceTool !== "draw-zone" &&
            !zoneDragOrigin
          }
          onDragMove={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
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
          onMouseLeave={() => {
            setDrawCursor(null);
            setHoveredCanvasPlantId(null);
          }}
          onClick={(e) => {
            if (e.target !== stageRef.current) return;
            const pt = pointerInStage();
            if (!pt) return;
            if (workspaceTool === "draw-zone") {
              addDrawPoint(pt.x, pt.y);
              return;
            }
            selectCanvasPlant(null);
            closeDetailPanel();
          }}
        >
          <Layer>
            <CanvasBackdropLayer bounds={backdropBounds} />
            {bgImg && (
              <KonvaImage
                image={bgImg}
                x={backdropBounds.x}
                y={backdropBounds.y}
                width={backdropBounds.width}
                height={backdropBounds.height}
                opacity={0.85}
                listening={false}
              />
            )}
            <ScaleGridLayer bounds={gridBounds} visible={showScaleGrid} />
            <ZoneLayer
              zones={zones}
              activeZoneId={activeZoneId}
              drawPoints={drawPoints}
              workspaceTool={workspaceTool}
            />
            {workspaceTool === "draw-zone" && (
              <DrawMeasureOverlay
                points={drawPoints}
                cursor={drawCursor}
                showRubberBand={drawCursor != null}
              />
            )}
          </Layer>
          <Layer>
            {plantsToRender.map((cp) => (
              <PlantCircle
                key={cp.canvasId}
                canvasId={cp.canvasId}
                plantId={cp.plantId}
                x={cp.x}
                y={cp.y}
                canvas_radius_feet={cp.canvas_radius_feet}
                image_url={cp.image_url}
                common_name={cp.common_name}
                category={cp.category}
                canopy_layer={cp.canopy_layer}
                is_invasive_in_florida={cp.is_invasive_in_florida}
                selected={selectedCanvasPlantId === cp.canvasId}
                hovered={hoveredCanvasPlantId === cp.canvasId}
                outsideZone={plantOutsideOwnedZone(cp, zones)}
                layerDimmed={hiddenLayers.includes(cp.canopy_layer)}
                placementFlash={placementFlashCanvasId === cp.canvasId}
                compactVisuals={compactCanvasVisuals}
                onHover={(hovering) =>
                  setHoveredCanvasPlantId(hovering ? cp.canvasId : null)
                }
                onSelect={() => selectCanvasPlant(cp.canvasId)}
                onOpenProfile={() => openCanvasPlantProfile(cp.canvasId)}
                draggable={workspaceTool !== "draw-zone"}
                dragDistance={isMobile ? (selectedCanvasPlantId === cp.canvasId ? 6 : 28) : 3}
                onDragEnd={(x, y) => {
                  pushHistory();
                  movePlant(cp.canvasId, x, y);
                }}
              />
            ))}
          </Layer>
          <Layer>
            <ZoneResizeHandles
              zones={zones}
              activeZoneId={activeZoneId}
              workspaceTool={workspaceTool}
            />
          </Layer>
          {selectedPlant && !detailPanelOpen && (
            <Layer>
              <CompanionSuggestions
                hostCanvasId={selectedPlant.canvasId}
                hostX={selectedPlant.x}
                hostY={selectedPlant.y}
                hostRadiusFeet={selectedPlant.canvas_radius_feet}
                plantId={selectedPlant.plantId}
              />
            </Layer>
          )}
        </Stage>
      </div>
    );
  },
);
