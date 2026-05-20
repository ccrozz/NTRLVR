import { useState, type RefObject } from "react";
import type { DesignerCanvasHandle } from "./DesignerCanvas";
import { useDesignerStore } from "../../store/useDesignerStore";

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
      <path
        d="M9 7H5v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 11c1.5-3.5 4.8-6 9-6 5 0 8 4 8 8s-3 8-8 8c-3.2 0-5.8-1.6-7.2-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
      <path
        d="M15 7h4v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11c-1.5-3.5-4.8-6-9-6-5 0-8 4-8 8s3 8 8 8c3.2 0 5.8-1.6 7.2-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.1 1.1M8.5 10.5 4 15v4h4l4.5-4.5M16.5 7.5l2-2M10 14l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 20v-4M4 12H2M22 12h-2M12 4V2M12 22v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function CanvasToolbar({
  canvasRef,
}: {
  canvasRef: RefObject<DesignerCanvasHandle | null>;
}) {
  const [open, setOpen] = useState(false);
  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const canUndo = useDesignerStore((s) => s.history.length > 0);
  const canRedo = useDesignerStore((s) => s.redoHistory.length > 0);
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
      className={`designer-canvas-dock designer-toolbar${open ? " is-open" : ""}`}
    >
      <div
        className="designer-canvas-dock-pill designer-toolbar-pill"
        aria-label="Canvas tools"
      >
        <span className="designer-canvas-dock-icon designer-toolbar-icon">
          <ToolsIcon />
        </span>
        <div className="designer-toolbar-quick" role="group" aria-label="Quick canvas controls">
          <button
            type="button"
            className="designer-toolbar-quick-btn"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => setZoom(zoom + 0.1)}
          >
            +
          </button>
          <button
            type="button"
            className="designer-toolbar-quick-btn"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => setZoom(zoom - 0.1)}
          >
            −
          </button>
          <button
            type="button"
            className="designer-toolbar-quick-btn designer-toolbar-quick-btn--text"
            onClick={() => canvasRef.current?.centerOnContent()}
            title="Pan to center your space and plants"
          >
            Center
          </button>
          <button
            type="button"
            className="designer-toolbar-quick-btn designer-toolbar-quick-btn--icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            className="designer-toolbar-quick-btn designer-toolbar-quick-btn--icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
        </div>
        <button
          type="button"
          className={`designer-toolbar-menu-toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls="designer-toolbar-menu"
          aria-label={open ? "Close more tools" : "More canvas tools"}
          title={open ? "Close menu" : "More tools"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="designer-toolbar-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="designer-toolbar-menu"
          className="designer-canvas-dock-menu designer-toolbar-menu"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className={`designer-canvas-dock-menu-item${workspacePanelOpen ? " is-active" : ""}`}
            onClick={() => {
              const next = !workspacePanelOpen;
              setWorkspacePanelOpen(next);
              if (next) setOpen(false);
            }}
          >
            Your garden space
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-canvas-dock-menu-item"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ntr-open-auto-fill"));
            }}
          >
            Build your garden
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-canvas-dock-menu-item${showRuler ? " is-active" : ""}`}
            onClick={() => setShowRuler(!showRuler)}
            title="Foot grid and scale bar"
          >
            {showRuler ? "Hide grid" : "Foot grid"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-canvas-dock-menu-item${compactCanvasVisuals ? " is-active" : ""}`}
            onClick={() => setCompactCanvasVisuals(!compactCanvasVisuals)}
            title="Simple plant icons vs full canopy rings"
          >
            {compactCanvasVisuals ? "Show canopy rings" : "Simple icons"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-canvas-dock-menu-item"
            onClick={uploadPhoto}
          >
            Yard photo
          </button>
          <button
            type="button"
            role="menuitem"
            className="designer-canvas-dock-menu-item"
            onClick={exportPng}
          >
            Export PNG
          </button>
          <button
            type="button"
            role="menuitem"
            className={`designer-canvas-dock-menu-item${canvasView === "cross-section" ? " is-active" : ""}`}
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
