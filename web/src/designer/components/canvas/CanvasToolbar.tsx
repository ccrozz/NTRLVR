import { useState, type RefObject } from "react";
import type { DesignerCanvasHandle } from "./DesignerCanvas";
import { useDesignerStore } from "../../store/useDesignerStore";

export function CanvasToolbar({
  canvasRef,
}: {
  canvasRef: RefObject<DesignerCanvasHandle | null>;
}) {
  const [open, setOpen] = useState(false);
  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const undo = useDesignerStore((s) => s.undo);
  const canUndo = useDesignerStore((s) => s.history.length > 0);
  const showRuler = useDesignerStore((s) => s.showRuler);
  const setShowRuler = useDesignerStore((s) => s.setShowRuler);
  const setBackgroundImage = useDesignerStore((s) => s.setBackgroundImage);
  const setCanvasMode = useDesignerStore((s) => s.setCanvasMode);
  const workspacePanelOpen = useDesignerStore((s) => s.workspacePanelOpen);
  const setWorkspacePanelOpen = useDesignerStore((s) => s.setWorkspacePanelOpen);
  const canvasView = useDesignerStore((s) => s.canvasView);
  const setCanvasView = useDesignerStore((s) => s.setCanvasView);
  const compactCanvasVisuals = useDesignerStore((s) => s.compactCanvasVisuals);
  const setCompactCanvasVisuals = useDesignerStore(
    (s) => s.setCompactCanvasVisuals,
  );

  function uploadPhoto() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setCanvasMode("photo");
    };
    input.click();
  }

  function exportPng() {
    const data = canvasRef.current?.exportPng();
    if (!data) return;
    const a = document.createElement("a");
    a.href = data;
    a.download = "food-forest-layout.png";
    a.click();
  }

  return (
    <div
      className={`designer-toolbar${open ? " is-open" : ""}`}
      data-open={open || undefined}
    >
      <div className="designer-toolbar-head">
        <button
          type="button"
          className="designer-toolbar-zoom"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => setZoom(zoom + 0.1)}
        >
          +
        </button>
        <button
          type="button"
          className="designer-toolbar-zoom"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => setZoom(zoom - 0.1)}
        >
          −
        </button>
        <button
          type="button"
          className="designer-toolbar-center"
          onClick={() => canvasRef.current?.centerOnContent()}
          title="Pan to center your space and plants"
        >
          Center
        </button>
        <button
          type="button"
          className="designer-toolbar-undo"
          onClick={undo}
          disabled={!canUndo}
          title="Undo last change"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          className="designer-toolbar-toggle"
          aria-expanded={open}
          aria-controls="designer-toolbar-menu"
          title={open ? "Hide canvas tools" : "Canvas tools"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="designer-toolbar-toggle-icon" aria-hidden>
            {open ? "×" : "⋯"}
          </span>
        </button>
      </div>

      {open && (
        <div id="designer-toolbar-menu" className="designer-toolbar-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className={`designer-toolbar-item${workspacePanelOpen ? " is-active" : ""}`}
            onClick={() => {
              const next = !workspacePanelOpen;
              setWorkspacePanelOpen(next);
              if (next) setOpen(false);
            }}
          >
            Space
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-toolbar-item"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ntr-open-auto-fill"));
            }}
          >
            Auto-fill layout
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-toolbar-item${showRuler ? " is-active" : ""}`}
            onClick={() => setShowRuler(!showRuler)}
            title="Foot grid and scale bar"
          >
            {showRuler ? "Hide grid" : "Foot grid"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-toolbar-item${compactCanvasVisuals ? " is-active" : ""}`}
            onClick={() => setCompactCanvasVisuals(!compactCanvasVisuals)}
            title="Simple plant icons vs full canopy rings"
          >
            {compactCanvasVisuals ? "Show canopy rings" : "Simple icons"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-toolbar-item"
            onClick={uploadPhoto}
          >
            Yard photo
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-toolbar-item"
            onClick={exportPng}
          >
            Export PNG
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-toolbar-item${canvasView === "cross-section" ? " is-active" : ""}`}
            onClick={() =>
              setCanvasView(
                canvasView === "cross-section" ? "top-down" : "cross-section",
              )
            }
            title="Side profile of vertical plant stacking"
          >
            Cross section
          </button>
        </div>
      )}
    </div>
  );
}
