import { useDesignerStore } from "../store/useDesignerStore";

export function MobileDesignerBar() {
  const mobileSidebarOpen = useDesignerStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useDesignerStore((s) => s.setMobileSidebarOpen);
  const sidebarMode = useDesignerStore((s) => s.sidebarMode);
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);

  function openBrowse() {
    setSidebarMode("browse");
    setMobileSidebarOpen(true);
  }

  function openBuild() {
    setSidebarMode("build");
    setMobileSidebarOpen(true);
  }

  function focusCanvas() {
    setMobileSidebarOpen(false);
  }

  return (
    <nav
      className="designer-mobile-bar"
      aria-label="Designer sections"
    >
      <button
        type="button"
        className={`designer-mobile-bar-btn${mobileSidebarOpen && sidebarMode === "browse" ? " is-active" : ""}`}
        onClick={openBrowse}
        aria-pressed={mobileSidebarOpen && sidebarMode === "browse"}
      >
        Plants
      </button>
      <button
        type="button"
        className={`designer-mobile-bar-btn${mobileSidebarOpen && sidebarMode === "build" ? " is-active" : ""}`}
        onClick={openBuild}
        aria-pressed={mobileSidebarOpen && sidebarMode === "build"}
      >
        Build
      </button>
      <button
        type="button"
        className={`designer-mobile-bar-btn designer-mobile-bar-btn--canvas${!mobileSidebarOpen ? " is-active" : ""}`}
        onClick={focusCanvas}
        aria-pressed={!mobileSidebarOpen}
      >
        Canvas
      </button>
    </nav>
  );
}
