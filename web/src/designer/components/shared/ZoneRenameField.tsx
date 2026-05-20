import { useEffect, useState } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";

/** Rename a workspace bed (switcher selection or explicit zone id). */
export function ZoneRenameField({
  zoneId,
  className,
}: {
  zoneId?: string;
  className?: string;
}) {
  const zones = useDesignerStore((s) => s.zones);
  const spaceListZoneId = useDesignerStore((s) => s.spaceListZoneId);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const renameZone = useDesignerStore((s) => s.renameZone);

  const resolvedId =
    zoneId ??
    (spaceListZoneId !== "all" ? spaceListZoneId : activeZoneId) ??
    null;
  const zone = resolvedId
    ? zones.find((z) => z.id === resolvedId)
    : undefined;

  const [draft, setDraft] = useState(zone?.name ?? "");

  useEffect(() => {
    setDraft(zone?.name ?? "");
  }, [zone?.id, zone?.name]);

  if (!zone) return null;

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== zone!.name) {
      renameZone(zone!.id, trimmed);
    } else {
      setDraft(zone!.name);
    }
  }

  return (
    <label
      className={`zone-rename-field${className ? ` ${className}` : ""}`}
    >
      <span className="zone-rename-field-label">Bed name</span>
      <input
        type="text"
        className="zone-rename-field-input"
        value={draft}
        maxLength={64}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label={`Rename ${zone.name}`}
      />
    </label>
  );
}
