import { zoneAreaSqFt } from "./zone-geometry";
import type { WorkspaceZone } from "../types/workspace";

export function zoneSummary(zone: WorkspaceZone): string {
  const area = zoneAreaSqFt(zone);
  const areaStr = area != null ? ` · ~${Math.round(area)} sq ft` : "";
  if (zone.shape === "rectangle") {
    return `Rectangle ${zone.widthFeet ?? "?"}×${zone.heightFeet ?? "?"} ft${areaStr}`;
  }
  if (zone.shape === "circle") {
    const d = (zone.radiusFeet ?? 0) * 2;
    return `Circle ${d} ft across${areaStr}`;
  }
  if (zone.shape === "polygon") {
    const pts = zone.points?.length ?? 0;
    return `Custom outline (${pts} points)${areaStr}`;
  }
  return `Bed${areaStr}`;
}
