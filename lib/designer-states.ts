/** States with a full designer catalog (curated seeds + regional onboarding). */
export type DesignerStateCode = "FL" | "TN" | "CT";

export type DesignerStateConfig = {
  code: DesignerStateCode;
  name: string;
  /** Short label for nav chips */
  shortName: string;
  tagline: string;
  /** Minimum USDA subzone included in the designer plant pool */
  minCatalogZone: string;
  /** Typical middle zone for defaults */
  defaultZone: string;
};

export const DESIGNER_STATES: DesignerStateConfig[] = [
  {
    code: "FL",
    name: "Florida",
    shortName: "Florida",
    tagline: "Design your Florida food forest",
    minCatalogZone: "8b",
    defaultZone: "10a",
  },
  {
    code: "TN",
    name: "Tennessee",
    shortName: "Tennessee",
    tagline: "Design your Tennessee food forest",
    minCatalogZone: "6a",
    defaultZone: "7a",
  },
  {
    code: "CT",
    name: "Connecticut",
    shortName: "Connecticut",
    tagline: "Design your Connecticut food forest",
    minCatalogZone: "5b",
    defaultZone: "6b",
  },
];

export const DESIGNER_STATE_CODES = DESIGNER_STATES.map((s) => s.code);

export const DEFAULT_DESIGNER_STATE: DesignerStateCode = "FL";

export const DESIGNER_STATE_STORAGE_KEY = "ntr-designer-state";

export function isDesignerStateCode(value: string): value is DesignerStateCode {
  return DESIGNER_STATE_CODES.includes(value.toUpperCase() as DesignerStateCode);
}

export function designerStateConfig(
  code: string,
): DesignerStateConfig | undefined {
  return DESIGNER_STATES.find((s) => s.code === code.toUpperCase());
}

export function parseDesignerStateParam(
  value: string | null | undefined,
): DesignerStateCode {
  if (value && isDesignerStateCode(value)) return value.toUpperCase() as DesignerStateCode;
  return DEFAULT_DESIGNER_STATE;
}
