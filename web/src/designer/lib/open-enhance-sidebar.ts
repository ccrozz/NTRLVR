import { useDesignerStore } from "../store/useDesignerStore";

/** Open Enhance guild flow and surface the sidebar (mobile sheet on narrow screens). */
export function openEnhanceGuildSidebar(zoneId?: string | null) {
  const store = useDesignerStore.getState();
  if (zoneId) {
    store.setActiveZoneId(zoneId);
    store.setSpaceListZoneId(zoneId);
  }
  store.setSidebarMode("enhance");
  store.setMobileSidebarOpen(true);
}
