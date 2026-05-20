import { useDesignerStore } from "../../store/useDesignerStore";
import { SidebarTabs } from "./SidebarTabs";
import { PlantBrowsePanel } from "./PlantBrowsePanel";
import { BuildForMeFlow } from "./BuildForMeFlow";

export function PlantSidebar() {
  const sidebarMode = useDesignerStore((s) => s.sidebarMode);
  const buildForMeSession = useDesignerStore((s) => s.buildForMeSession);

  return (
    <aside className="designer-sidebar">
      <div className="designer-sidebar-tabs-wrap">
        <SidebarTabs />
      </div>
      {sidebarMode === "browse" ? (
        <PlantBrowsePanel />
      ) : (
        <BuildForMeFlow key={buildForMeSession} />
      )}
    </aside>
  );
}
