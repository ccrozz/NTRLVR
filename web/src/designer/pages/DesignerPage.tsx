import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AutoPopulateWizard } from "../components/AutoPopulateWizard";
import { DesignerHelpOverlay } from "../components/DesignerHelpOverlay";
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
import { useDesignerStore } from "../store/useDesignerStore";
import { stagePoint } from "../lib/canvas-utils";
import type { PlantListItem } from "../types";
import "../styles/designer.css";

const HELP_DISMISSED_KEY = "ntr-designer-help-dismissed";

export function DesignerPage() {
  const [params] = useSearchParams();
  const canvasRef = useRef<DesignerCanvasHandle>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const addPlant = useDesignerStore((s) => s.addPlant);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const closeDetailPanel = useDesignerStore((s) => s.closeDetailPanel);
  const detailOpen = Boolean(selectedPlantId || selectedCanvasPlantId);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const hasExistingLayout = canvasPlants.length > 0 || zones.length > 0;

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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
    const open = () => setAutoFillOpen(true);
    window.addEventListener("ntr-open-auto-fill", open);
    return () => window.removeEventListener("ntr-open-auto-fill", open);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = e.target as HTMLElement;
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      ) {
        return;
      }
      const { selectedCanvasPlantId, deleteSelectedCanvasPlant } =
        useDesignerStore.getState();
      if (!selectedCanvasPlantId) return;
      e.preventDefault();
      deleteSelectedCanvasPlant();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const { active, over, activatorEvent } = event;
    if (over?.id !== "canvas" || !activatorEvent) return;

    const plant = active.data.current?.plant as PlantListItem | undefined;
    if (!plant) return;

    const el = wrapRef.current?.querySelector(".designer-canvas-wrap");
    if (!el) {
      addPlant(plant, 200, 200);
      return;
    }

    const rect = el.getBoundingClientRect();
    const clientX =
      "clientX" in activatorEvent
        ? (activatorEvent as PointerEvent).clientX +
          (event.delta?.x ?? 0)
        : rect.left + rect.width / 2;
    const clientY =
      "clientY" in activatorEvent
        ? (activatorEvent as PointerEvent).clientY +
          (event.delta?.y ?? 0)
        : rect.top + rect.height / 2;

    const pt = stagePoint(clientX, clientY, rect, stagePos, zoom);
    addPlant(plant, pt.x, pt.y);
  }

  return (
    <div className="designer-root">
      <DesignerTopBar
        helpOpen={helpOpen}
        onHelpClick={toggleHelp}
        onAutoPopulateClick={() => setAutoFillOpen(true)}
      />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="designer-layout" ref={wrapRef}>
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
            <CanvasToolbar canvasRef={canvasRef} />
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
            <AutoPopulateWizard
              open={autoFillOpen}
              onClose={() => setAutoFillOpen(false)}
              hasExistingLayout={hasExistingLayout}
            />
          </div>
        </div>
      </DndContext>
    </div>
  );
}
