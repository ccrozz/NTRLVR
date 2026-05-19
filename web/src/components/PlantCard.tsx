import { Link } from "react-router-dom";
import type { PlantSummary } from "../types";
import { plantCardZoneLabels } from "../zones";
import { PlantPlaceholderIcon } from "./Icons";

export function PlantCard({
  plant,
  myStateCode,
  myStateName,
  stateZones,
  myZone,
  showZones = true,
}: {
  plant: PlantSummary;
  myStateCode?: string;
  myStateName?: string;
  stateZones?: string[];
  myZone?: string;
  showZones?: boolean;
}) {
  const zoneLabels = showZones
    ? plantCardZoneLabels(plant.growing_zones ?? [], { stateZones, myZone })
    : [];
  const nativeHere =
    myStateCode &&
    plant.native_states?.some(
      (s) => s.toUpperCase() === myStateCode.toUpperCase(),
    );

  const overlayBadges: { key: string; label: string; className?: string }[] = [];
  if (plant.is_edible) {
    overlayBadges.push({ key: "edible", label: "Edible", className: "badge-accent" });
  }
  if (nativeHere) {
    overlayBadges.push({
      key: "native",
      label: myStateName ? `Native to ${myStateName}` : "Native here",
      className: "badge-accent",
    });
  }
  if (plant.is_invasive_in_florida) {
    overlayBadges.push({
      key: "invasive",
      label: "Invasive",
      className: "badge-warn",
    });
  }

  return (
    <Link to={`/plants/${plant.id}`} className="plant-card">
      <section className="plant-card-image">
        {plant.image_url ? (
          <img src={plant.image_url} alt={plant.common_name} loading="lazy" />
        ) : (
          <span className="plant-card-placeholder">
            <PlantPlaceholderIcon />
            No photo yet
          </span>
        )}
        {overlayBadges.length > 0 && (
          <div className="plant-card-badges-overlay">
            {overlayBadges.map((b) => (
              <span key={b.key} className={`badge badge-light ${b.className ?? ""}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </section>
      <section className="plant-card-body">
        <h3>{plant.common_name}</h3>
        <p className="scientific">{plant.scientific_name}</p>
        <div className="plant-card-meta">
          {zoneLabels.map((z) => (
            <span key={z} className="badge badge-zone" title="USDA hardiness zones">
              {z}
            </span>
          ))}
          <span className="badge">{plant.canopy_layer}</span>
        </div>
      </section>
    </Link>
  );
}
