/** Numeric sort key for USDA subzones (1a … 13b). */
function zoneSortKey(zone: string): number {
  const m = /^(\d{1,2})([ab])$/i.exec(zone.trim());
  if (!m) return -1;
  const n = parseInt(m[1], 10);
  const sub = m[2].toLowerCase() === "b" ? 1 : 0;
  return n * 2 + sub;
}

export function sortZones(zones: string[]): string[] {
  return [...new Set(zones.map((z) => z.trim()).filter(Boolean))].sort(
    (a, b) => {
      const ka = zoneSortKey(a);
      const kb = zoneSortKey(b);
      if (ka < 0 && kb < 0) return a.localeCompare(b);
      if (ka < 0) return 1;
      if (kb < 0) return -1;
      return ka - kb;
    },
  );
}

/** Compact label, e.g. "8a–10b". */
export function formatZoneRange(zones: string[]): string | null {
  const sorted = sortZones(zones);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? first : `${first}–${last}`;
}

/**
 * Zone badges for catalog cards: prefer overlap with the user's state,
 * otherwise show the plant's full sorted span (not lex-first subzones).
 */
export function plantMatchesZone(plantZones: string[], zone: string): boolean {
  const z = zone.trim().toLowerCase();
  if (!z) return false;
  return plantZones.some((pz) => pz.toLowerCase() === z);
}

export function plantCardZoneLabels(
  plantZones: string[],
  opts?: { stateZones?: string[]; myZone?: string },
): string[] {
  const all = sortZones(plantZones);
  if (!all.length) return [];

  const myZone = opts?.myZone?.trim();
  if (myZone && plantMatchesZone(all, myZone)) {
    return [myZone];
  }

  let focus = all;
  if (opts?.stateZones?.length) {
    const allowed = new Set(opts.stateZones.map((z) => z.toLowerCase()));
    const overlap = all.filter((z) => allowed.has(z.toLowerCase()));
    if (overlap.length) focus = overlap;
  }

  const label = formatZoneRange(focus);
  return label ? [label] : [];
}
