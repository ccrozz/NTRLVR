import { useDesignerStore } from "../../store/useDesignerStore";

export function DesignerMobileWelcome() {
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const mobileSidebarOpen = useDesignerStore((s) => s.mobileSidebarOpen);
  const mobileToolsOpen = useDesignerStore((s) => s.mobileToolsOpen);

  if (
    canvasPlants.length > 0 ||
    zones.length > 0 ||
    mobileSidebarOpen ||
    mobileToolsOpen
  ) {
    return null;
  }

  return (
    <div className="designer-mobile-welcome" aria-hidden>
      <div className="designer-mobile-welcome-card">
        <p className="designer-mobile-welcome-title">Start your layout</p>
        <p className="designer-mobile-welcome-body">
          Tap <strong>Plants</strong> to browse and drag species onto the grid,
          or <strong>Build</strong> for a guided plan.
        </p>
      </div>
    </div>
  );
}
