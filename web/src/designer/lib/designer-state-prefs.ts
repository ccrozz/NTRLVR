import {
  DEFAULT_DESIGNER_STATE,
  DESIGNER_STATE_STORAGE_KEY,
  isDesignerStateCode,
  type DesignerStateCode,
} from "@lib/designer-states";

export function loadDesignerState(): DesignerStateCode {
  try {
    const raw = localStorage.getItem(DESIGNER_STATE_STORAGE_KEY);
    if (raw && isDesignerStateCode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_DESIGNER_STATE;
}

export function saveDesignerState(code: DesignerStateCode) {
  try {
    localStorage.setItem(DESIGNER_STATE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}
