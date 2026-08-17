import { isScreenDirection, type ScreenDirection } from "./garden-check";

const SUNSET_KEY = "ntr-designer-sunset-dir";
const ZONE_KEY = "ntr-designer-hardiness-zone";
const PANEL_KEY = "ntr-designer-garden-check-open";

export function loadSunsetDirection(): ScreenDirection | null {
  try {
    const raw = localStorage.getItem(SUNSET_KEY);
    if (raw && isScreenDirection(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSunsetDirection(dir: ScreenDirection | null) {
  try {
    if (dir) localStorage.setItem(SUNSET_KEY, dir);
    else localStorage.removeItem(SUNSET_KEY);
  } catch {
    /* ignore */
  }
}

export function loadHardinessZone(): string | null {
  try {
    return localStorage.getItem(ZONE_KEY);
  } catch {
    return null;
  }
}

export function saveHardinessZone(zone: string | null) {
  try {
    if (zone) localStorage.setItem(ZONE_KEY, zone);
    else localStorage.removeItem(ZONE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadGardenCheckOpen(): boolean {
  try {
    return localStorage.getItem(PANEL_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveGardenCheckOpen(open: boolean) {
  try {
    localStorage.setItem(PANEL_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}
