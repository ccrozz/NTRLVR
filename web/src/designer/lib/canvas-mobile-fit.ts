import { ZOOM_MAX, ZOOM_MIN } from "./canvas-wheel";

/** After Build For Me places a garden on a phone, avoid zooming out to a tiny overview. */
export const MOBILE_GARDEN_FIT_PAD_PX = 48;
/** Cap auto-fit so the bed stays readable; user can pinch up to ZOOM_MAX. */
export const MOBILE_GARDEN_FIT_MAX_ZOOM = 1.35;

export function mobileGardenFitZoom(
  layoutWidthPx: number,
  layoutHeightPx: number,
  viewportW: number,
  viewportH: number,
): number {
  if (
    layoutWidthPx <= 0 ||
    layoutHeightPx <= 0 ||
    viewportW <= 0 ||
    viewportH <= 0
  ) {
    return 1;
  }
  const pad = MOBILE_GARDEN_FIT_PAD_PX;
  const fit = Math.min(
    (viewportW - pad) / layoutWidthPx,
    (viewportH - pad) / layoutHeightPx,
  );
  const capped = Math.min(fit, MOBILE_GARDEN_FIT_MAX_ZOOM);
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, capped));
}
