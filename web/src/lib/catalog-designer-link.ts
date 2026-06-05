import {
  DEFAULT_DESIGNER_STATE,
  isDesignerStateCode,
  type DesignerStateCode,
} from "@lib/designer-states";

export function catalogDesignerStateCode(
  catalogStateCode: string,
): DesignerStateCode {
  const code = catalogStateCode.trim().toUpperCase();
  if (isDesignerStateCode(code)) return code;
  return DEFAULT_DESIGNER_STATE;
}

export function catalogDesignerPlantUrl(
  plantId: string,
  catalogStateCode?: string,
): string {
  const state = catalogDesignerStateCode(catalogStateCode ?? "");
  return `/designer?state=${state}&plant=${encodeURIComponent(plantId)}`;
}
