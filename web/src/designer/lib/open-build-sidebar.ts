import { useDesignerStore } from "../store/useDesignerStore";

/** Open Build For Me and surface the sidebar (mobile sheet on narrow screens). */
export function openBuildForMeSidebar() {
  const store = useDesignerStore.getState();
  store.setSidebarMode("build");
  store.setMobileSidebarOpen(true);
}
