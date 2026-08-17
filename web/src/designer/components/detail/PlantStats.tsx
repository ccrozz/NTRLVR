import type { Plant } from "../../../types";

function feetRange(range?: [number, number]): string | null {
  if (!range) return null;
  const [min, max] = range;
  if (!min && !max) return null;
  const lo = Math.round(min);
  const hi = Math.round(max);
  return lo === hi ? `${hi} ft` : `${lo}–${hi} ft`;
}

/** Zone lists run long ("9a, 9b, 10a, 10b"); show the span instead. */
function zoneSpan(zones: string[]): string | null {
  if (zones.length === 0) return null;
  if (zones.length <= 2) return zones.join(", ");
  return `${zones[0]}–${zones[zones.length - 1]}`;
}

export function PlantStats({ plant }: { plant: Plant }) {
  const zones = zoneSpan(
    plant.florida_hardiness_zones ?? plant.growing_zones ?? [],
  );
  const height = feetRange(plant.mature_height_feet);
  const spread = feetRange(plant.mature_spread_feet);
  const size =
    height && spread
      ? `${height} tall · ${spread} wide`
      : (height ?? spread ?? null);

  const cells: { label: string; value: string }[] = [];
  if (zones) cells.push({ label: "Hardiness", value: `Zones ${zones}` });
  if (plant.sunlight) cells.push({ label: "Sun", value: plant.sunlight });
  if (plant.water_needs)
    cells.push({ label: "Water", value: `${plant.water_needs} water` });
  if (size) cells.push({ label: "Mature size", value: size });
  if (plant.growth_rate)
    cells.push({ label: "Growth rate", value: plant.growth_rate });
  cells.push({ label: "Layer", value: plant.canopy_layer });

  if (cells.length === 0) return null;

  return (
    <dl className="designer-detail-stats">
      {cells.map((cell) => (
        <div key={cell.label} className="designer-detail-stat">
          <dt>{cell.label}</dt>
          <dd>{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}
