import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { parseDesignerStateParam } from "@lib/designer-states";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import type { CollisionDetection } from "@dnd-kit/core";
import { DesignerHelpOverlay } from "../components/DesignerHelpOverlay";
import { GardenPlanSheet } from "../components/canvas/GardenPlanSheet";
import { DesignerTopBar } from "../components/DesignerTopBar";
import { PlantSidebar } from "../components/sidebar/PlantSidebar";
import {
  DesignerCanvas,
  type DesignerCanvasHandle,
} from "../components/canvas/DesignerCanvas";
import { CanvasToolbar } from "../components/canvas/CanvasToolbar";
import {
  EDGE_RULER_LEFT,
  EDGE_RULER_TOP,
} from "../lib/canvas-ruler-insets";
import { SelectionActionBar } from "../components/canvas/SelectionActionBar";
import { DrawZoneDock } from "../components/workspace/DrawZoneDock";
import { GardenPanel } from "../components/garden/GardenPanel";
import { WorkspacePanel } from "../components/workspace/WorkspacePanel";
import { PlantDetailPanel } from "../components/detail/PlantDetailPanel";
import { MobileDesignerBar } from "../components/MobileDesignerBar";
import { DesignerStateSwitcher } from "../components/DesignerStateSwitcher";
import { openBuildForMeSidebar } from "../lib/open-build-sidebar";
import { useDesignerStore } from "../store/useDesignerStore";
import { stagePoint } from "../lib/canvas-utils";
import { useDesignerDndSensors } from "../lib/designer-dnd-sensors";
import { useMatchMedia } from "../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../lib/mobile-layout";
import { PlantDragPreview } from "../components/canvas/PlantDragPreview";
import {
  dragDropClientPoint,
  isDropOverCanvas,
  markPlantDragJustEnded,
  plantFromActive,
  plantFromDragEvent,
} from "../lib/designer-drag-drop";
import { focusDesignerCanvas } from "../lib/focus-designer-canvas";
import type { PlantListItem } from "../types";
import "../styles/designer.css";

const HELP_DISMISSED_KEY = "ntr-designer-help-dismissed";

const designerCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

export function DesignerPage() {
  const [params] = useSearchParams();
  const canvasRef = useRef<DesignerCanvasHandle>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mobileToolbarBoundsRef = useRef<HTMLDivElement>(null);

  const addPlant = useDesignerStore((s) => s.addPlant);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const closeDetailPanel = useDesignerStore((s) => s.closeDetailPanel);
  const detailOpen = Boolean(selectedPlantId);
  const [helpOpen, setHelpOpen] = useState(false);
  const mobileSidebarOpen = useDesignerStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useDesignerStore((s) => s.setMobileSidebarOpen);
  const setDesignerState = useDesignerStore((s) => s.setDesignerState);

  useEffect(() => {
    setDesignerState(parseDesignerStateParam(params.get("state")));
  }, [params, setDesignerState]);

  useEffect(() => {
    try {
      if (localStorage.getItem(HELP_DISMISSED_KEY) !== "1") {
        setHelpOpen(true);
      }
    } catch {
      setHelpOpen(true);
    }
  }, []);

  function dismissHelp() {
    setHelpOpen(false);
    try {
      localStorage.setItem(HELP_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function toggleHelp() {
    if (helpOpen) {
      dismissHelp();
    } else {
      setHelpOpen(true);
    }
  }
  const setCanvasMode = useDesignerStore((s) => s.setCanvasMode);
  const stagePos = useDesignerStore((s) => s.stagePos);
  const zoom = useDesignerStore((s) => s.zoom);
  const showRuler = useDesignerStore((s) => s.showRuler);
  const workspaceTool = useDesignerStore((s) => s.workspaceTool);
  const edgeRulersVisible = showRuler || workspaceTool === "draw-zone";

  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const sensors = useDesignerDndSensors();
  const [dragPlant, setDragPlant] = useState<PlantListItem | null>(null);
  const [plantDragActive, setPlantDragActive] = useState(false);

  const prepareDesignerOnLoad = useDesignerStore((s) => s.prepareDesignerOnLoad);

  useEffect(() => {
    prepareDesignerOnLoad();
  }, [prepareDesignerOnLoad]);

  useEffect(() => {
    document.documentElement.classList.add("designer-mode");
    document.body.classList.add("designer-mode");
    return () => {
      document.documentElement.classList.remove("designer-mode");
      document.body.classList.remove("designer-mode");
    };
  }, []);

  useEffect(() => {
    if (params.get("mode") === "upload") {
      setCanvasMode("photo");
    }
  }, [params, setCanvasMode]);

  useEffect(() => {
    const open = () => openBuildForMeSidebar();
    window.addEventListener("ntr-open-auto-fill", open);
    return () => window.removeEventListener("ntr-open-auto-fill", open);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      ) {
        return;
      }

      const store = useDesignerStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (store.redoHistory.length > 0) store.redo();
        } else if (store.history.length > 0) {
          store.undo();
        }
        return;
      }

      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (store.redoHistory.length > 0) store.redo();
        return;
      }

      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!store.selectedCanvasPlantId) return;
      e.preventDefault();
      store.deleteSelectedCanvasPlant();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragPlant(null);
      setPlantDragActive(false);

      const plant = plantFromDragEvent(event);
      if (!plant) return;

      const el = wrapRef.current?.querySelector(".designer-canvas-wrap");
      if (!isDropOverCanvas(event, el)) return;

      const fromSidebarList = String(event.active.id).startsWith("plant-");
      if (fromSidebarList) {
        markPlantDragJustEnded();
        focusDesignerCanvas();
      }

      if (!el) {
        addPlant(plant, 200, 200);
        return;
      }

      const rect = el.getBoundingClientRect();
      const drop = dragDropClientPoint(event);
      const clientX = drop?.x ?? rect.left + rect.width / 2;
      const clientY = drop?.y ?? rect.top + rect.height / 2;

      const pt = stagePoint(clientX, clientY, rect, stagePos, zoom);
      addPlant(plant, pt.x, pt.y);
    },
    [addPlant, stagePos, zoom],
  );

  return (
    <div className="designer-root">
      <DesignerTopBar
        helpOpen={helpOpen}
        onHelpClick={toggleHelp}
        onAutoPopulateClick={openBuildForMeSidebar}
      />
      <div className="designer-state-switcher-wrap">
        <DesignerStateSwitcher compact />
      </div>
      {isMobile && (
        <div
          ref={mobileToolbarBoundsRef}
          className="designer-mobile-toolbar-bounds"
          aria-hidden
        />
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={designerCollisionDetection}
        onDragStart={(e) => {
          const plant = plantFromActive(e.active);
          if (!plant) return;
          setDragPlant(plant);
          if (!String(e.active.id).startsWith("plant-")) return;
          setPlantDragActive(true);
          if (isMobile) setMobileSidebarOpen(false);
        }}
        onDragCancel={() => {
          setDragPlant(null);
          setPlantDragActive(false);
        }}
        onDragEnd={onDragEnd}
      >
        {isMobile && (
          <CanvasToolbar
            canvasRef={canvasRef}
            mobileBoundsRef={mobileToolbarBoundsRef}
          />
        )}
        <div
          className={`designer-layout${mobileSidebarOpen ? " designer-layout--sidebar-open" : ""}${plantDragActive ? " designer-layout--plant-drag" : ""}`}
          ref={wrapRef}
        >
          <button
            type="button"
            className="designer-sidebar-backdrop"
            aria-label="Close plants panel"
            tabIndex={mobileSidebarOpen ? 0 : -1}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <PlantSidebar />
          <div
            className={`designer-main${detailOpen ? " designer-main--detail-open" : ""}${edgeRulersVisible ? " has-edge-rulers" : ""}`}
            style={
              edgeRulersVisible
                ? ({
                    "--edge-ruler-top": `${EDGE_RULER_TOP}px`,
                    "--edge-ruler-left": `${EDGE_RULER_LEFT}px`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <GardenPanel />
            <WorkspacePanel />
            <DrawZoneDock />
            {!isMobile && <CanvasToolbar canvasRef={canvasRef} />}
            <DesignerCanvas ref={canvasRef} />
            <SelectionActionBar />
            {detailOpen && (
              <button
                type="button"
                className="designer-detail-backdrop"
                aria-label="Close plant details"
                onClick={() => closeDetailPanel()}
              />
            )}
            <PlantDetailPanel />
            {helpOpen && <DesignerHelpOverlay onClose={dismissHelp} />}
            <GardenPlanSheet />
          </div>
          <MobileDesignerBar />
        </div>
        <DragOverlay dropAnimation={null}>
          {dragPlant ? (
            <PlantDragPreview plant={dragPlant} zoom={zoom} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
