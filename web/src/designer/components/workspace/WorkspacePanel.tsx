import { useEffect, useRef, useState } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import {
  centeredPanelPosition,
  clampPanelPosition,
  useFloatingPanelPosition,
} from "../../hooks/useFloatingPanelPosition";
import type { PanelPosition } from "../../hooks/useFloatingPanelPosition";
import { plantInsideZones, zoneAreaSqFt } from "../../lib/zone-geometry";

const ZONE_COLORS = ["#7ec850", "#5eb8d4", "#e8b84a", "#c49ae8", "#f08080"];

const PANEL_POS_KEY = "ntr-workspace-panel-pos";
/** Overwritten when the panel opens — centered in the canvas area */
const DEFAULT_PANEL_POS = { x: 0, y: 0 };

export function zoneColor(index: number): string {
  return ZONE_COLORS[index % ZONE_COLORS.length]!;
}

export function WorkspacePanel() {
  const open = useDesignerStore((s) => s.workspacePanelOpen);
  const setOpen = useDesignerStore((s) => s.setWorkspacePanelOpen);
  const zones = useDesignerStore((s) => s.zones);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const workspaceTool = useDesignerStore((s) => s.workspaceTool);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);

  const addRectangleZone = useDesignerStore((s) => s.addRectangleZone);
  const addCircleZone = useDesignerStore((s) => s.addCircleZone);
  const removeZone = useDesignerStore((s) => s.removeZone);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);
  const setWorkspaceTool = useDesignerStore((s) => s.setWorkspaceTool);
  const cancelDrawZone = useDesignerStore((s) => s.cancelDrawZone);
  const setDrawCursor = useDesignerStore((s) => s.setDrawCursor);

  const boundsRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const wasDrawingRef = useRef(false);
  const positionBeforeDrawRef = useRef<PanelPosition | null>(null);
  const { panelRef, position, setPosition, dragHandleProps } =
    useFloatingPanelPosition(PANEL_POS_KEY, DEFAULT_PANEL_POS, boundsRef);

  const [rectW, setRectW] = useState("40");
  const [rectH, setRectH] = useState("30");
  const [diameter, setDiameter] = useState("30");

  const isDrawing = workspaceTool === "draw-zone";

  const outsideCount = canvasPlants.filter(
    (p) => !plantInsideZones(p.x, p.y, zones),
  ).length;

  /** Center on screen when the panel is opened (first load or Space toggle). */
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened || isDrawing) return;

    const applyCenter = () => {
      const centered = centeredPanelPosition(
        boundsRef.current,
        panelRef.current,
      );
      if (centered) setPosition(centered);
      return centered != null;
    };

    if (!applyCenter()) {
      requestAnimationFrame(() => {
        applyCenter();
      });
    }
  }, [open, isDrawing, panelRef, setPosition]);

  /** While drawing: tuck above dock; when done: restore pre-draw position. */
  useEffect(() => {
    if (!open) {
      wasDrawingRef.current = false;
      positionBeforeDrawRef.current = null;
      return;
    }

    if (isDrawing && !wasDrawingRef.current) {
      positionBeforeDrawRef.current = { x: position.x, y: position.y };
      const bounds = boundsRef.current;
      const panel = panelRef.current;
      if (bounds && panel) {
        const dockReserve = 88;
        const pad = 12;
        const y = Math.max(
          pad,
          bounds.clientHeight - panel.offsetHeight - dockReserve - pad,
        );
        setPosition({ x: pad, y });
      }
    } else if (!isDrawing && wasDrawingRef.current) {
      const saved = positionBeforeDrawRef.current;
      positionBeforeDrawRef.current = null;
      if (saved) {
        const restored = clampPanelPosition(
          saved,
          panelRef.current,
          boundsRef.current,
        );
        setPosition(restored);
      }
    }

    wasDrawingRef.current = isDrawing;
  }, [isDrawing, open, position.x, position.y, panelRef, setPosition]);

  function startDrawOutline() {
    setWorkspaceTool("draw-zone");
  }

  function exitDrawMode() {
    cancelDrawZone();
  }

  return (
    <div ref={boundsRef} className="workspace-panel-bounds" aria-hidden={!open}>
      {open && (
        <aside
          ref={panelRef}
          className={`workspace-panel workspace-panel--floating${isDrawing ? " workspace-panel--drawing" : ""}`}
          style={{ left: position.x, top: position.y }}
          aria-label="Workspace dimensions"
          onPointerEnter={() => isDrawing && setDrawCursor(null)}
        >
          <header
            className="workspace-panel-header workspace-panel-drag-handle"
            {...dragHandleProps}
            title="Drag to move"
          >
            <div className="workspace-panel-title-wrap">
              <span className="workspace-panel-drag-icon" aria-hidden>
                ⠿
              </span>
              <h2>Your space</h2>
            </div>
            <button
              type="button"
              className="workspace-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Collapse panel"
            >
              ×
            </button>
          </header>

          {isDrawing ? (
            <div className="workspace-panel-draw-compact">
              <p>
                Drawing on the <strong>canvas</strong> — use the bar at the
                bottom to finish, undo, or cancel.
              </p>
              <button
                type="button"
                className="rr-btn rr-btn-secondary workspace-exit-draw"
                onClick={() => exitDrawMode()}
              >
                Exit draw mode
              </button>
            </div>
          ) : (
            <>
              <p className="workspace-panel-hint">
                Set a bed size in feet, or sketch your own outline on the grid.
                In <strong>Select</strong> mode, drag a zone to move it and its
                plants together.
              </p>

              {zones.length > 0 && outsideCount > 0 && (
                <p className="workspace-panel-warn" role="status">
                  {outsideCount} plant{outsideCount === 1 ? "" : "s"} outside your
                  defined space
                </p>
              )}

              <fieldset className="workspace-fieldset">
                <legend>Rectangle</legend>
                <div className="workspace-dim-row">
                  <label>
                    Width (ft)
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={rectW}
                      onChange={(e) => setRectW(e.target.value)}
                    />
                  </label>
                  <label>
                    Length (ft)
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={rectH}
                      onChange={(e) => setRectH(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="rr-btn rr-btn-secondary workspace-add-btn"
                  onClick={() => {
                    const w = parseFloat(rectW);
                    const h = parseFloat(rectH);
                    if (w > 0 && h > 0) addRectangleZone(w, h);
                  }}
                >
                  Add rectangle
                </button>
              </fieldset>

              <fieldset className="workspace-fieldset">
                <legend>Circle</legend>
                <label className="workspace-dim-full">
                  Diameter (ft)
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={diameter}
                    onChange={(e) => setDiameter(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="rr-btn rr-btn-secondary workspace-add-btn"
                  onClick={() => {
                    const d = parseFloat(diameter);
                    if (d > 0) addCircleZone(d);
                  }}
                >
                  Add circle
                </button>
              </fieldset>

              <div className="workspace-draw-entry">
                <p className="workspace-draw-entry-label">Custom outline</p>
                <p className="workspace-draw-entry-hint">
                  Click corners on the grid (1 square = 1 ft). Controls stay at
                  the bottom so nothing blocks your drawing.
                </p>
                <button
                  type="button"
                  className="rr-btn rr-btn-primary workspace-draw-start"
                  onClick={() => startDrawOutline()}
                >
                  Draw custom outline
                </button>
              </div>
            </>
          )}

          {!isDrawing && zones.length > 0 && (
            <section className="workspace-zone-list">
              <h3>Zones ({zones.length})</h3>
              <ul>
                {zones.map((z, i) => {
                  const area = zoneAreaSqFt(z);
                  return (
                    <li key={z.id}>
                      <button
                        type="button"
                        className={`workspace-zone-item${activeZoneId === z.id ? " active" : ""}`}
                        onClick={() => setActiveZoneId(z.id)}
                      >
                        <span
                          className="workspace-zone-swatch"
                          style={{ background: zoneColor(i) }}
                        />
                        <span className="workspace-zone-meta">
                          <strong>{z.name}</strong>
                          <span>
                            {z.shape}
                            {area != null ? ` · ${Math.round(area)} sq ft` : ""}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="workspace-zone-remove"
                        onClick={() => removeZone(z.id)}
                        aria-label={`Remove ${z.name}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>
      )}
    </div>
  );
}
