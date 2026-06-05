import type { DesignerStateCode } from "./designer-states.js";

/** Lowercase state tag stored on plant rows (e.g. `fl`, `tn`). */
export function stateTag(stateCode: DesignerStateCode): string {
  return stateCode.toLowerCase();
}
