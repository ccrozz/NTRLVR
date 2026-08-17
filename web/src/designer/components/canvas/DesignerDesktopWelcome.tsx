import { useDesignerStore } from "../../store/useDesignerStore";
import { openBuildForMeSidebar } from "../../lib/open-build-sidebar";

export function DesignerDesktopWelcome() {
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const sidebarOpen = useDesignerStore((s) => s.mobileSidebarOpen);
  const setSidebarOpen = useDesignerStore((s) => s.setMobileSidebarOpen);
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);
  const setWorkspaceTool = useDesignerStore((s) => s.setWorkspaceTool);
  const pendingPlacementPlant = useDesignerStore(
    (s) => s.pendingPlacementPlant,
  );

  // Its buttons would intercept the first placement click, which lands mid-canvas.
  if (canvasPlants.length > 0 || zones.length > 0 || pendingPlacementPlant) {
    return null;
  }

  return (
    <div className="designer-canvas-welcome">
      <div className="designer-canvas-welcome-card">
        <p className="designer-canvas-welcome-eyebrow">Empty plan</p>
        <h2 className="designer-canvas-welcome-title">
          Draw a bed, then fill it with plants
        </h2>
        <p className="designer-canvas-welcome-body">
          Sketch the shape of your growing space so spacing and sun are measured
          in real feet, or let us draft a food forest for your climate.
        </p>
        <div className="designer-canvas-welcome-actions">
          <button
            type="button"
            className="designer-canvas-welcome-btn designer-canvas-welcome-btn--primary"
            onClick={() => setWorkspaceTool("draw-zone")}
          >
            Draw a bed
          </button>
          <button
            type="button"
            className="designer-canvas-welcome-btn"
            onClick={() => {
              setSidebarMode("browse");
              if (!sidebarOpen) setSidebarOpen(true);
            }}
          >
            Browse plants
          </button>
          <button
            type="button"
            className="designer-canvas-welcome-link"
            onClick={() => openBuildForMeSidebar()}
          >
            Build it for me
          </button>
        </div>
      </div>
    </div>
  );
}
