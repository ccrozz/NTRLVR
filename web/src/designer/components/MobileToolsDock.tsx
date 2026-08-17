import { useEffect, useState, type ReactNode, type RefObject } from "react";
import type { DesignerCanvasHandle } from "./canvas/DesignerCanvas";
import { useDesignerStore } from "../store/useDesignerStore";
import { LABEL_MODE_LABEL, nextLabelMode } from "../lib/canvas-label-mode";

function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M9 7H5v4M5 11c1.5-3.5 4.8-6 9-6 5 0 8 4 8 8s-3 8-8 8c-3.2 0-5.8-1.6-7.2-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRedo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M15 7h4v4M19 11c-1.5-3.5-4.8-6-9-6-5 0-8 4-8 8s3 8 8 8c3.2 0 5.8-1.6 7.2-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DockBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`designer-mobile-tools-btn${active ? " is-active" : ""}`}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="designer-mobile-tools-btn-icon">{children}</span>
      <span className="designer-mobile-tools-btn-label">{label}</span>
    </button>
  );
}

function MoreBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`designer-mobile-tools-more-btn${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function MobileToolsDock({
  canvasRef,
}: {
  canvasRef: RefObject<DesignerCanvasHandle | null>;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileToolsOpen = useDesignerStore((s) => s.mobileToolsOpen);

  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const requestCanvasFit = useDesignerStore((s) => s.requestCanvasFit);
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
  const canvasUnderstoryFocus = useDesignerStore((s) => s.canvasUnderstoryFocus);
  const setCanvasUnderstoryFocus = useDesignerStore(
    (s) => s.setCanvasUnderstoryFocus,
  );
  const canvasLabelMode = useDesignerStore((s) => s.canvasLabelMode);
  const setCanvasLabelMode = useDesignerStore((s) => s.setCanvasLabelMode);

  useEffect(() => {
    if (!mobileToolsOpen) setMoreOpen(false);
  }, [mobileToolsOpen]);

  useEffect(() => {
    const root = document.querySelector(".designer-root");
    if (!root) return;
    root.classList.toggle("designer-root--mobile-tools", mobileToolsOpen);
    root.classList.toggle(
      "designer-root--mobile-tools-more",
      mobileToolsOpen && moreOpen,
    );
    return () => {
      root.classList.remove("designer-root--mobile-tools");
      root.classList.remove("designer-root--mobile-tools-more");
    };
  }, [mobileToolsOpen, moreOpen]);

  function uploadPhoto() {
    setMoreOpen(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setBackgroundImage(URL.createObjectURL(file));
      setCanvasMode("photo");
    };
    input.click();
  }

  function exportPng() {
    setMoreOpen(false);
    const data = canvasRef.current?.exportPng();
    if (!data) return;
    const a = document.createElement("a");
    a.href = data;
    a.download = "food-forest-layout.png";
    a.click();
  }

  function openBuild() {
    setMoreOpen(false);
    window.dispatchEvent(new CustomEvent("ntr-open-auto-fill"));
  }

  function toggleSpace() {
    setWorkspacePanelOpen(!workspacePanelOpen);
    setMoreOpen(false);
  }

  if (!mobileToolsOpen) return null;

  return (
    <div
      className={`designer-mobile-tools-dock${moreOpen ? " is-more-open" : ""}`}
      role="toolbar"
      aria-label="Canvas tools"
    >
      <div className="designer-mobile-tools-primary">
        <DockBtn label="Undo" disabled={!canUndo} onClick={undo}>
          <IconUndo />
        </DockBtn>
        <DockBtn label="Redo" disabled={!canRedo} onClick={redo}>
          <IconRedo />
        </DockBtn>
        <DockBtn
          label="Grid"
          active={showRuler}
          onClick={() => setShowRuler(!showRuler)}
        >
          <IconGrid />
        </DockBtn>
        <DockBtn label="Zoom out" onClick={() => setZoom(zoom - 0.2)}>
          −
        </DockBtn>
        <DockBtn label="Fit" onClick={() => requestCanvasFit()}>
          ⊡
        </DockBtn>
        <DockBtn label="Zoom in" onClick={() => setZoom(zoom + 0.2)}>
          +
        </DockBtn>
        <DockBtn
          label="More"
          active={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          ⋯
        </DockBtn>
      </div>
      {moreOpen && (
        <div className="designer-mobile-tools-more" role="menu">
          <MoreBtn
            label="Beds & space"
            active={workspacePanelOpen}
            onClick={toggleSpace}
          />
          <MoreBtn label="Build for me" onClick={openBuild} />
          <MoreBtn
            label={compactCanvasVisuals ? "Full plant rings" : "Simple dots"}
            active={compactCanvasVisuals}
            onClick={() => setCompactCanvasVisuals(!compactCanvasVisuals)}
          />
          <MoreBtn
            label={LABEL_MODE_LABEL[canvasLabelMode]}
            active={canvasLabelMode !== "off"}
            onClick={() => setCanvasLabelMode(nextLabelMode(canvasLabelMode))}
          />
          <MoreBtn
            label={
              canvasUnderstoryFocus ? "All canopy layers" : "Focus shrubs & herbs"
            }
            active={canvasUnderstoryFocus}
            onClick={() => setCanvasUnderstoryFocus(!canvasUnderstoryFocus)}
          />
          <MoreBtn
            label={
              canvasView === "cross-section" ? "Top-down view" : "Side profile"
            }
            active={canvasView === "cross-section"}
            onClick={() =>
              setCanvasView(
                canvasView === "cross-section" ? "top-down" : "cross-section",
              )
            }
          />
          <MoreBtn label="Yard photo" onClick={uploadPhoto} />
          <MoreBtn label="Save PNG" onClick={exportPng} />
        </div>
      )}
    </div>
  );
}
