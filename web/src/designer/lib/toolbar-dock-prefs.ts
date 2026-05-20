const EXPANDED_KEY = "ntr-toolbar-expanded";

export type ToolbarDockPosition = { x: number; y: number };

export function loadToolbarExpanded(defaultExpanded = false): boolean {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return defaultExpanded;
}

export function saveToolbarExpanded(expanded: boolean) {
  try {
    localStorage.setItem(EXPANDED_KEY, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function defaultMobileToolbarPosition(
  boundsEl: HTMLElement | null,
): ToolbarDockPosition {
  if (!boundsEl) return { x: 12, y: 80 };
  const barReserve =
    parseFloat(
      getComputedStyle(boundsEl).getPropertyValue(
        "--designer-mobile-bar-height",
      ),
    ) || 56;
  return {
    x: 12,
    y: Math.max(56, boundsEl.clientHeight - barReserve - 88),
  };
}
