import { useDesignerStore } from "../../store/useDesignerStore";

/** Pinch works on the canvas; segmented − / Fit / + for one-handed zoom on phones. */
export function MobileCanvasZoomControls() {
  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const requestCanvasFit = useDesignerStore((s) => s.requestCanvasFit);

  return (
    <div
      className="designer-mobile-zoom"
      role="group"
      aria-label="Canvas zoom"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="designer-mobile-zoom-btn designer-mobile-zoom-btn--step"
        aria-label="Zoom out"
        onClick={() => setZoom(zoom - 0.2)}
      >
        <span aria-hidden>−</span>
      </button>
      <button
        type="button"
        className="designer-mobile-zoom-btn designer-mobile-zoom-btn--fit"
        aria-label="Fit garden in view"
        onClick={() => requestCanvasFit()}
      >
        Fit
      </button>
      <button
        type="button"
        className="designer-mobile-zoom-btn designer-mobile-zoom-btn--step"
        aria-label="Zoom in"
        onClick={() => setZoom(zoom + 0.2)}
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
