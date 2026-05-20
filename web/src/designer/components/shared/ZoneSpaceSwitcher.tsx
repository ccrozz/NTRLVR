import { useEffect, useRef } from "react";
import {
  countCanvasPlantsInZone,
  zoneTabLabel,
  zoneTabSublabel,
} from "../../lib/zone-plant-groups";
import { useDesignerStore } from "../../store/useDesignerStore";
import { ZoneRenameField } from "./ZoneRenameField";

export function ZoneSpaceSwitcher({
  className,
  hideRename,
}: {
  className?: string;
  hideRename?: boolean;
}) {
  const zones = useDesignerStore((s) => s.zones);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const spaceListZoneId = useDesignerStore((s) => s.spaceListZoneId);
  const setSpaceListZoneId = useDesignerStore((s) => s.setSpaceListZoneId);
  const zoneGardenPlans = useDesignerStore((s) => s.zoneGardenPlans);

  const prevZoneCount = useRef(zones.length);

  useEffect(() => {
    if (zones.length < 2) {
      if (spaceListZoneId !== "all") setSpaceListZoneId("all");
      prevZoneCount.current = zones.length;
      return;
    }
    if (zones.length >= 2 && prevZoneCount.current < 2 && spaceListZoneId === "all") {
      setSpaceListZoneId(zones[0]!.id);
    }
    const valid =
      spaceListZoneId === "all" ||
      zones.some((z) => z.id === spaceListZoneId);
    if (!valid) setSpaceListZoneId(zones[0]!.id);
    prevZoneCount.current = zones.length;
  }, [zones, spaceListZoneId, setSpaceListZoneId]);

  if (zones.length < 2) return null;

  function select(id: "all" | string) {
    setSpaceListZoneId(id);
  }

  return (
    <div className={className ? `zone-space-nav ${className}` : "zone-space-nav"}>
      <div
        className="zone-space-switcher"
        role="tablist"
        aria-label="Garden spaces"
      >
        {zones.map((zone) => {
          const count = countCanvasPlantsInZone(canvasPlants, zone, zones);
          const on = spaceListZoneId === zone.id;
          const hasPlan = Boolean(zoneGardenPlans[zone.id]);
          return (
            <button
              key={zone.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`zone-space-switcher-btn${on ? " is-on" : ""}${hasPlan ? " has-plan" : ""}`}
              onClick={() => select(zone.id)}
              title={
                hasPlan
                  ? `${zoneTabSublabel(zone)} · Saved plant list`
                  : zoneTabSublabel(zone)
              }
            >
              <span className="zone-space-switcher-name">
                {zoneTabLabel(zone, count)}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={spaceListZoneId === "all"}
          className={`zone-space-switcher-btn zone-space-switcher-btn--all${spaceListZoneId === "all" ? " is-on" : ""}`}
          onClick={() => select("all")}
        >
          All ({canvasPlants.length})
        </button>
      </div>
      {!hideRename && spaceListZoneId !== "all" && (
        <ZoneRenameField className="zone-space-rename" />
      )}
    </div>
  );
}
