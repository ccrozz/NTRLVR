import { useDesignerStore } from "../store/useDesignerStore";

/** Dismiss overlays and the mobile plants/build sheet so the canvas is visible. */
export function focusDesignerCanvas() {
  const store = useDesignerStore.getState();
  store.setMobileSidebarOpen(false);
  store.setPlanSheetOpen(false);
  store.closeDetailPanel();
}
