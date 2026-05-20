export const MOBILE_LAYOUT_QUERY = "(max-width: 768px)";

export function isMobileDesignerLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
}
