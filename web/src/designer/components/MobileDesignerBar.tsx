import { useDesignerStore } from "../store/useDesignerStore";

export function MobileDesignerBar() {
  const mobileSidebarOpen = useDesignerStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useDesignerStore((s) => s.setMobileSidebarOpen);
  const mobileToolsOpen = useDesignerStore((s) => s.mobileToolsOpen);
  const setMobileToolsOpen = useDesignerStore((s) => s.setMobileToolsOpen);
  const sidebarMode = useDesignerStore((s) => s.sidebarMode);
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);

  const canvasActive = !mobileSidebarOpen && !mobileToolsOpen;

  function openBrowse() {
    setSidebarMode("browse");
    setMobileToolsOpen(false);
    setMobileSidebarOpen(true);
  }

  function openBuild() {
    setSidebarMode("build");
    setMobileToolsOpen(false);
    setMobileSidebarOpen(true);
  }

  function focusCanvas() {
    setMobileSidebarOpen(false);
    setMobileToolsOpen(false);
  }

  function toggleTools() {
    if (mobileToolsOpen) {
      setMobileToolsOpen(false);
      return;
    }
    setMobileSidebarOpen(false);
    setMobileToolsOpen(true);
  }

  return (
    <nav className="designer-mobile-bar" aria-label="Designer sections">
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
        className={`designer-mobile-bar-btn designer-mobile-bar-btn--canvas${canvasActive ? " is-active" : ""}`}
        onClick={focusCanvas}
        aria-pressed={canvasActive}
      >
        Canvas
      </button>
      <button
        type="button"
        className={`designer-mobile-bar-btn designer-mobile-bar-btn--tools${mobileToolsOpen ? " is-active" : ""}`}
        onClick={toggleTools}
        aria-pressed={mobileToolsOpen}
        aria-expanded={mobileToolsOpen}
      >
        Tools
      </button>
    </nav>
  );
}
