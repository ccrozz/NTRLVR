import { useDesignerStore } from "../../store/useDesignerStore";
import { SidebarTabs } from "./SidebarTabs";
import { PlantBrowsePanel } from "./PlantBrowsePanel";
import { BuildForMeFlow } from "./BuildForMeFlow";
import { EnhanceGuildFlow } from "./EnhanceGuildFlow";

export function PlantSidebar() {
  const sidebarMode = useDesignerStore((s) => s.sidebarMode);
  const buildForMeSession = useDesignerStore((s) => s.buildForMeSession);
  const enhanceSession = useDesignerStore((s) => s.enhanceSession);

  return (
    <aside id="designer-plant-sidebar" className="designer-sidebar">
      <div className="designer-sidebar-tabs-wrap">
        <SidebarTabs />
      </div>
      {sidebarMode === "browse" ? (
        <PlantBrowsePanel />
      ) : sidebarMode === "enhance" ? (
        <EnhanceGuildFlow key={enhanceSession} />
      ) : (
        <BuildForMeFlow key={buildForMeSession} />
      )}
    </aside>
  );
}
