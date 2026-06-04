const MOBILE_EXPANDED_KEY = "ntr-toolbar-expanded";
const DESKTOP_EXPANDED_KEY = "ntr-toolbar-desktop-open";

export type ToolbarDockPosition = { x: number; y: number };

function readBool(key: string): boolean | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function loadToolbarExpanded(isMobile: boolean): boolean {
  const key = isMobile ? MOBILE_EXPANDED_KEY : DESKTOP_EXPANDED_KEY;
  const stored = readBool(key);
  if (stored !== null) return stored;
  return false;
}

export function saveToolbarExpanded(expanded: boolean, isMobile: boolean) {
  const key = isMobile ? MOBILE_EXPANDED_KEY : DESKTOP_EXPANDED_KEY;
  try {
    localStorage.setItem(key, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Default: top-right of the mobile header / canvas band (below state chips). */
export function defaultMobileHeaderToolbarPosition(
  boundsEl: HTMLElement | null,
): ToolbarDockPosition {
  const pad = 10;
  if (!boundsEl) return { x: pad, y: pad };
  const pillWidth = 92;
  return {
    x: Math.max(pad, boundsEl.clientWidth - pillWidth - pad),
    y: pad,
  };
}
