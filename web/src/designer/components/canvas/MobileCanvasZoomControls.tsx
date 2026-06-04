import { useDesignerStore } from "../../store/useDesignerStore";

/** Pinch works on the canvas; +/- for one-handed zoom on phones. */
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
        className="designer-mobile-zoom-btn"
        aria-label="Zoom out"
        onClick={() => setZoom(zoom - 0.2)}
      >
        −
      </button>
      <button
        type="button"
        className="designer-mobile-zoom-btn"
        aria-label="Fit garden in view"
        onClick={() => requestCanvasFit()}
      >
        Fit
      </button>
      <button
        type="button"
        className="designer-mobile-zoom-btn"
        aria-label="Zoom in"
        onClick={() => setZoom(zoom + 0.2)}
      >
        +
      </button>
    </div>
  );
}
