import { useState } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import { plantInsideZones, zoneAreaSqFt } from "../../lib/zone-geometry";

const ZONE_COLORS = ["#7ec850", "#5eb8d4", "#e8b84a", "#c49ae8", "#f08080"];

export function zoneColor(index: number): string {
  return ZONE_COLORS[index % ZONE_COLORS.length]!;
}

export function WorkspacePanel() {
  const open = useDesignerStore((s) => s.workspacePanelOpen);
  const setOpen = useDesignerStore((s) => s.setWorkspacePanelOpen);
  const zones = useDesignerStore((s) => s.zones);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const workspaceTool = useDesignerStore((s) => s.workspaceTool);
  const drawPoints = useDesignerStore((s) => s.drawPoints);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);

  const addRectangleZone = useDesignerStore((s) => s.addRectangleZone);
  const addCircleZone = useDesignerStore((s) => s.addCircleZone);
  const removeZone = useDesignerStore((s) => s.removeZone);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);
  const setWorkspaceTool = useDesignerStore((s) => s.setWorkspaceTool);
  const finishDrawZone = useDesignerStore((s) => s.finishDrawZone);
  const cancelDrawZone = useDesignerStore((s) => s.cancelDrawZone);

  const [rectW, setRectW] = useState("40");
  const [rectH, setRectH] = useState("30");
  const [diameter, setDiameter] = useState("30");

  const outsideCount = canvasPlants.filter(
    (p) => !plantInsideZones(p.x, p.y, zones),
  ).length;

  if (!open) return null;

  return (
    <aside className="workspace-panel" aria-label="Workspace dimensions">
      <header className="workspace-panel-header">
        <h2>Your space</h2>
        <button
          type="button"
          className="workspace-panel-close"
          onClick={() => setOpen(false)}
          aria-label="Collapse panel"
        >
          ×
        </button>
      </header>

      <p className="workspace-panel-hint">
        Define plot boundaries in feet. Use <strong>Select</strong> mode, then drag a
        zone on the canvas to move it and every plant inside it together.
      </p>

      {zones.length > 0 && outsideCount > 0 && (
        <p className="workspace-panel-warn" role="status">
          {outsideCount} plant{outsideCount === 1 ? "" : "s"} outside your defined
          space
        </p>
      )}

      <div className="workspace-shape-tabs">
        <button
          type="button"
          className={`designer-pill${workspaceTool === "select" ? " active" : ""}`}
          onClick={() => setWorkspaceTool("select")}
        >
          Select
        </button>
        <button
          type="button"
          className={`designer-pill${workspaceTool === "draw-zone" ? " active" : ""}`}
          onClick={() => setWorkspaceTool("draw-zone")}
        >
          Draw
        </button>
      </div>

      {workspaceTool === "draw-zone" ? (
        <div className="workspace-draw-hint">
          <p>
            Grid shows feet (1 square = 1 ft). Click corners on the canvas; segment
            lengths appear as you draw. Need at least 3 points.
          </p>
          <p className="workspace-draw-count">
            {drawPoints.length} point{drawPoints.length === 1 ? "" : "s"}
          </p>
          <div className="workspace-draw-actions">
            <button
              type="button"
              className="rr-btn rr-btn-primary"
              disabled={drawPoints.length < 3}
              onClick={() => finishDrawZone()}
            >
              Finish zone
            </button>
            <button
              type="button"
              className="rr-btn rr-btn-secondary"
              onClick={() => cancelDrawZone()}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}

      {zones.length > 0 && (
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
  );
}
