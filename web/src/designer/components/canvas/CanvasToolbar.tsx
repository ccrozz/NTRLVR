import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { DesignerCanvasHandle } from "./DesignerCanvas";
import { MOBILE_LAYOUT_QUERY, useMatchMedia } from "../../hooks/useMatchMedia";
import {
  loadToolbarExpanded,
  saveToolbarExpanded,
} from "../../lib/toolbar-dock-prefs";
import { useDesignerStore } from "../../store/useDesignerStore";

function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
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
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
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
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
      <path
        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      aria-hidden
      className={`designer-toolbar-chevron${open ? " is-open" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolbarBtn({
  label,
  title,
  active,
  disabled,
  onClick,
  children,
  className = "",
}: {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`designer-toolbar-btn${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      title={title ?? label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  );
}

function PopoverItem({
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
      className={`designer-toolbar-popover-item${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function CanvasToolbar({
  canvasRef,
}: {
  canvasRef: RefObject<DesignerCanvasHandle | null>;
}) {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const [moreOpen, setMoreOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [dockExpanded, setDockExpanded] = useState(() =>
    loadToolbarExpanded(isMobile),
  );

  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDockExpanded(loadToolbarExpanded(isMobile));
    setMoreOpen(false);
  }, [isMobile]);

  useLayoutEffect(() => {
    if (!moreOpen || isMobile || !moreBtnRef.current) return;
    const rect = moreBtnRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [moreOpen, isMobile, dockExpanded]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (moreBtnRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setMoreOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

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

  function setExpanded(next: boolean) {
    setDockExpanded(next);
    saveToolbarExpanded(next, isMobile);
    if (!next) setMoreOpen(false);
  }

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
    const next = !workspacePanelOpen;
    setWorkspacePanelOpen(next);
    setMoreOpen(false);
    if (next) setExpanded(false);
  }

  const morePopover = moreOpen && (
    <div
      ref={popoverRef}
      id="designer-toolbar-more"
      className="designer-toolbar-popover"
      role="menu"
      style={{ top: popoverPos.top, left: popoverPos.left }}
    >
      <PopoverItem
        label="Beds & space"
        active={workspacePanelOpen}
        onClick={toggleSpace}
      />
      <PopoverItem label="Build for me" onClick={openBuild} />
      <div className="designer-toolbar-popover-divider" />
      <PopoverItem
        label={showRuler ? "Hide foot grid" : "Show foot grid"}
        active={showRuler}
        onClick={() => setShowRuler(!showRuler)}
      />
      <PopoverItem
        label={compactCanvasVisuals ? "Full plant rings" : "Simple plant dots"}
        active={compactCanvasVisuals}
        onClick={() => setCompactCanvasVisuals(!compactCanvasVisuals)}
      />
      <PopoverItem
        label={
          canvasUnderstoryFocus
            ? "Show all canopy layers"
            : "Focus shrubs & herbs"
        }
        active={canvasUnderstoryFocus}
        onClick={() => setCanvasUnderstoryFocus(!canvasUnderstoryFocus)}
      />
      <PopoverItem
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
      <div className="designer-toolbar-popover-divider" />
      <PopoverItem label="Yard photo" onClick={uploadPhoto} />
      <PopoverItem label="Save as PNG" onClick={exportPng} />
    </div>
  );

  if (isMobile) return null;

  const desktopBar = (
    <div className="designer-toolbar-strip" role="toolbar" aria-label="Canvas tools">
      <ToolbarBtn label="Zoom out" onClick={() => setZoom(zoom - 0.1)}>
        −
      </ToolbarBtn>
      <ToolbarBtn label="Zoom in" onClick={() => setZoom(zoom + 0.1)}>
        +
      </ToolbarBtn>
      <ToolbarBtn
        label="Fit view"
        title="Center beds and plants"
        onClick={() => requestCanvasFit()}
      >
        Fit
      </ToolbarBtn>
      <span className="designer-toolbar-strip-divider" aria-hidden />
      <ToolbarBtn
        label="Undo"
        title="Undo (⌘Z)"
        disabled={!canUndo}
        onClick={undo}
      >
        <IconUndo />
      </ToolbarBtn>
      <ToolbarBtn
        label="Redo"
        title="Redo (⌘⇧Z)"
        disabled={!canRedo}
        onClick={redo}
      >
        <IconRedo />
      </ToolbarBtn>
      <span className="designer-toolbar-strip-divider" aria-hidden />
      <ToolbarBtn
        label="Foot grid"
        title="Toggle foot grid"
        active={showRuler}
        onClick={() => setShowRuler(!showRuler)}
      >
        <IconGrid />
      </ToolbarBtn>
      <button
        ref={moreBtnRef}
        type="button"
        className={`designer-toolbar-btn${moreOpen ? " is-active" : ""}`}
        title="More options"
        aria-label="More options"
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        onClick={() => setMoreOpen((v) => !v)}
      >
        <IconDots />
      </button>
      <ToolbarBtn
        label="Hide tools"
        title="Hide tools"
        onClick={() => setExpanded(false)}
      >
        <IconClose />
      </ToolbarBtn>
    </div>
  );

  return (
    <>
      <div
        ref={panelRef}
        className={[
          "designer-canvas-dock",
          "designer-toolbar",
          "designer-toolbar--desktop",
          dockExpanded ? "is-expanded" : "is-collapsed",
        ].join(" ")}
      >
        {!dockExpanded ? (
          <button
            type="button"
            className="designer-toolbar-trigger"
            aria-label="Show canvas tools"
            onClick={() => setExpanded(true)}
          >
            <span>Tools</span>
            <IconChevron open={false} />
          </button>
        ) : (
          desktopBar
        )}
      </div>
      {morePopover &&
        createPortal(
          morePopover,
          document.querySelector(".designer-root") ?? document.body,
        )}
    </>
  );
}
