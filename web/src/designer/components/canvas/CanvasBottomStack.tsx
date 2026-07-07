import { EVERGREEN_SOLUTIONS_URL } from "../../../lib/evergreen-partner";
import { useDesignerStore } from "../../store/useDesignerStore";
import { SelectionActionBar } from "./SelectionActionBar";

type CanvasBottomStackProps = {
  plantDragActive: boolean;
};

function EvergreenDragHint() {
  return (
    <p
      className="evergreen-design-drag-hint"
      role="status"
      aria-live="polite"
      onPointerDown={(e) => e.stopPropagation()}
    >
      Drop on the bed to place —{" "}
      <a
        href={EVERGREEN_SOLUTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        or hire Evergreen to install
      </a>
    </p>
  );
}

export function CanvasBottomStack({ plantDragActive }: CanvasBottomStackProps) {
  const sidebarMode = useDesignerStore((s) => s.sidebarMode);
  const canvasUnderstoryFocus = useDesignerStore((s) => s.canvasUnderstoryFocus);
  const setCanvasUnderstoryFocus = useDesignerStore(
    (s) => s.setCanvasUnderstoryFocus,
  );
  const showDragHint = plantDragActive && sidebarMode === "browse";

  return (
    <div className="designer-canvas-bottom-stack">
      {canvasUnderstoryFocus && (
        <p
          className="designer-canvas-focus-hint"
          role="status"
          onPointerDown={(e) => e.stopPropagation()}
        >
          Editing shrubs & herbs — canopy trees are faded.{" "}
          <button
            type="button"
            className="designer-canvas-focus-hint-exit"
            onClick={() => setCanvasUnderstoryFocus(false)}
          >
            Exit focus
          </button>
        </p>
      )}
      <SelectionActionBar plantDragActive={plantDragActive} />
      {showDragHint && <EvergreenDragHint />}
    </div>
  );
}
