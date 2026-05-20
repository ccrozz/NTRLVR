import type { Plant } from "../../../types";

export function PlantStats({ plant }: { plant: Plant }) {
  const zones = plant.florida_hardiness_zones ?? plant.growing_zones ?? [];

  return (
    <div className="detail-stats-compact">
      <span>{plant.sunlight}</span>
      <span aria-hidden>·</span>
      <span>{plant.water_needs} water</span>
      <span aria-hidden>·</span>
      <span>
        {plant.mature_height_feet[0]}–{plant.mature_height_feet[1]} ft tall
      </span>
      {zones.length > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>Zones {zones.slice(0, 4).join(", ")}</span>
        </>
      )}
    </div>
  );
}
