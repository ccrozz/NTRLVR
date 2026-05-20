import { useEffect, useRef, useState, type RefObject } from "react";
import type { DesignerCanvasHandle } from "./DesignerCanvas";
import {
  clampPanelPosition,
  useFloatingPanelPosition,
} from "../../hooks/useFloatingPanelPosition";
import { MOBILE_LAYOUT_QUERY, useMatchMedia } from "../../hooks/useMatchMedia";
import {
  defaultMobileToolbarPosition,
  loadToolbarExpanded,
  saveToolbarExpanded,
} from "../../lib/toolbar-dock-prefs";
import { useDesignerStore } from "../../store/useDesignerStore";

const TOOLBAR_POS_KEY = "ntr-toolbar-pos";

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
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(() =>
    loadToolbarExpanded(false),
  );

  const boundsRef = useRef<HTMLDivElement>(null);

  const { panelRef, position, setPosition, dragHandleProps } =
    useFloatingPanelPosition(TOOLBAR_POS_KEY, { x: 12, y: 80 }, boundsRef);

  useEffect(() => {
    if (!isMobile) return;
    try {
      if (localStorage.getItem(TOOLBAR_POS_KEY)) return;
    } catch {
      /* ignore */
    }
    const bounds = boundsRef.current;
    if (!bounds) return;
    setPosition(defaultMobileToolbarPosition(bounds));
  }, [isMobile, setPosition]);

  useEffect(() => {
    if (!isMobile || !boundsRef.current || !panelRef.current) return;
    const clamped = clampPanelPosition(
      position,
      panelRef.current,
      boundsRef.current,
    );
    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped);
    }
  }, [isMobile, dockExpanded, menuOpen, position, panelRef, setPosition]);

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

  function setExpanded(next: boolean) {
    setDockExpanded(next);
    saveToolbarExpanded(next);
    if (!next) setMenuOpen(false);
  }

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

  const mobileStyle = isMobile
    ? { left: position.x, top: position.y }
    : undefined;

  return (
    <>
      {isMobile && (
        <div ref={boundsRef} className="designer-toolbar-bounds" aria-hidden />
      )}
      <div
        ref={panelRef as React.Ref<HTMLDivElement>}
        className={`designer-canvas-dock designer-toolbar${menuOpen ? " is-open" : ""}${isMobile ? " designer-toolbar--mobile-float" : ""}${isMobile && !dockExpanded ? " designer-toolbar--collapsed" : ""}`}
        style={mobileStyle}
      >
        {isMobile && !dockExpanded ? (
          <div className="designer-toolbar-collapsed">
            <div
              role="button"
              tabIndex={0}
              className="designer-toolbar-drag-grip"
              aria-label="Drag canvas tools"
              title="Drag to move"
              {...dragHandleProps}
            >
              <span aria-hidden>⠿</span>
            </div>
            <button
              type="button"
              className="designer-toolbar-fab"
              aria-label="Open canvas tools"
              aria-expanded={false}
              title="Canvas tools"
              onClick={() => setExpanded(true)}
            >
              <ToolsIcon />
            </button>
          </div>
        ) : (
          <>
            <div className="designer-canvas-dock-pill designer-toolbar-pill">
              {isMobile && (
                <div
                  role="button"
                  tabIndex={0}
                  className="designer-toolbar-drag-grip designer-toolbar-drag-grip--inline"
                  aria-label="Drag canvas tools"
                  title="Drag to move"
                  {...dragHandleProps}
                >
                  <span aria-hidden>⠿</span>
                </div>
              )}
              <span className="designer-canvas-dock-icon designer-toolbar-icon">
                <ToolsIcon />
              </span>
              <div
                className="designer-toolbar-quick"
                role="group"
                aria-label="Quick canvas controls"
              >
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
              {isMobile ? (
                <button
                  type="button"
                  className="designer-toolbar-collapse"
                  aria-label="Collapse canvas tools"
                  title="Hide tools"
                  onClick={() => setExpanded(false)}
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                className={`designer-toolbar-menu-toggle${menuOpen ? " is-open" : ""}`}
                aria-expanded={menuOpen}
                aria-controls="designer-toolbar-menu"
                aria-label={menuOpen ? "Close more tools" : "More canvas tools"}
                title={menuOpen ? "Close menu" : "More tools"}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="designer-toolbar-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>

            {menuOpen && (
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
                    if (next) setMenuOpen(false);
                  }}
                >
                  Your garden space
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="designer-canvas-dock-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
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
                      canvasView === "cross-section"
                        ? "top-down"
                        : "cross-section",
                    )
                  }
                  title="Side profile of vertical plant stacking"
                >
                  Cross section
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
