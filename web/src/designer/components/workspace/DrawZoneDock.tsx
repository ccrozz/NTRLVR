import { useDesignerStore } from "../../store/useDesignerStore";

function stopUiPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

/** Bottom bar for polygon drawing — stays off the canvas click path. */
export function DrawZoneDock() {
  const workspaceTool = useDesignerStore((s) => s.workspaceTool);
  const drawPoints = useDesignerStore((s) => s.drawPoints);
  const setDrawCursor = useDesignerStore((s) => s.setDrawCursor);
  const undoDrawPoint = useDesignerStore((s) => s.undoDrawPoint);
  const finishDrawZone = useDesignerStore((s) => s.finishDrawZone);
  const cancelDrawZone = useDesignerStore((s) => s.cancelDrawZone);

  if (workspaceTool !== "draw-zone") return null;

  const canFinish = drawPoints.length >= 3;

  return (
    <div
      className="draw-zone-dock"
      role="toolbar"
      aria-label="Draw zone controls"
      onPointerEnter={() => setDrawCursor(null)}
    >
      <p className="draw-zone-dock-hint">
        Click corners on the grid. Click the{" "}
        <strong>first point</strong> again or <strong>Finish</strong> when done.
      </p>
      <div className="draw-zone-dock-actions">
        <span className="draw-zone-dock-count" aria-live="polite">
          {drawPoints.length} point{drawPoints.length === 1 ? "" : "s"}
          {!canFinish && drawPoints.length > 0
            ? ` · need ${3 - drawPoints.length} more`
            : ""}
        </span>
        <button
          type="button"
          className="draw-zone-dock-btn draw-zone-dock-btn--ghost"
          disabled={drawPoints.length === 0}
          onPointerDown={stopUiPointer}
          onClick={() => undoDrawPoint()}
        >
          Undo point
        </button>
        <button
          type="button"
          className="draw-zone-dock-btn draw-zone-dock-btn--ghost"
          onPointerDown={stopUiPointer}
          onClick={() => cancelDrawZone()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="draw-zone-dock-btn draw-zone-dock-btn--primary"
          disabled={!canFinish}
          onPointerDown={stopUiPointer}
          onClick={() => finishDrawZone()}
        >
          Finish zone
        </button>
      </div>
    </div>
  );
}
