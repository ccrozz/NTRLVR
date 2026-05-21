import type { DesignerStateCode } from "../designer-states.js";
import { stateByCode } from "../us-states.js";

export type StateWebHarvestConfig = {
  stateCode: DesignerStateCode;
  stateName: string;
  inaturalistPlaceId: number;
  gbifStateProvince: string;
  defaultZones: string[];
};

const PLACE_IDS: Record<DesignerStateCode, number> = {
  FL: 21,
  TN: 45,
  CT: 49,
};

export function webHarvestConfig(
  stateCode: DesignerStateCode,
): StateWebHarvestConfig {
  const st = stateByCode(stateCode);
  return {
    stateCode,
    stateName: st?.name ?? stateCode,
    inaturalistPlaceId: PLACE_IDS[stateCode],
    gbifStateProvince: st?.name ?? stateCode,
    defaultZones: st?.hardiness_zones ?? [],
  };
}
