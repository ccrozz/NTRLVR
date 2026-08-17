import { effectiveIsFloridaNative } from "@lib/plant-native-status";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { shouldIgnoreSidebarPlantClick } from "../../lib/designer-drag-drop";
import { canopyColor } from "../../lib/canopy-colors";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { PlantListItem } from "../../types";

function feetRange(range?: [number, number]): string | null {
  if (!range) return null;
  const [min, max] = range;
  if (!min && !max) return null;
  const lo = Math.round(min);
  const hi = Math.round(max);
  return lo === hi ? `${hi} ft` : `${lo}–${hi} ft`;
}

/** "Full sun to part shade" reads long on a card; keep the first clause. */
function shortSun(sunlight?: string): string | null {
  if (!sunlight) return null;
  return sunlight.split(/\s+to\s+|\//)[0]!.trim();
}

export function PlantGridCard({
  plant,
  selected,
  onSelect,
}: {
  plant: PlantListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plant-${plant.id}`,
    data: { plant },
  });

  const armPlantPlacement = useDesignerStore((s) => s.armPlantPlacement);
  const pendingPlacementPlant = useDesignerStore(
    (s) => s.pendingPlacementPlant,
  );
  const setSidebarOpen = useDesignerStore((s) => s.setMobileSidebarOpen);

  const layer = canopyColor(plant.canopy_layer);
  const initial = plant.common_name.trim().charAt(0).toUpperCase() || "?";
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(plant.image_url) && !imgFailed;

  const arming = pendingPlacementPlant?.id === plant.id;
  const sun = shortSun(plant.sunlight);
  const height = feetRange(plant.mature_height_feet);
  const spread =
    feetRange(plant.mature_spread_feet) ??
    (plant.canvas_radius_feet
      ? `${Math.round(plant.canvas_radius_feet * 2)} ft`
      : null);

  return (
    <div
      ref={setNodeRef}
      className={[
        "designer-plant-card",
        selected ? "is-selected" : "",
        arming ? "is-placing" : "",
        isDragging ? "is-dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <button
        type="button"
        className="designer-plant-card-body"
        aria-label={`View profile for ${plant.common_name}`}
        onClick={(e) => {
          if (isDragging || shouldIgnoreSidebarPlantClick()) {
            e.preventDefault();
            return;
          }
          onSelect();
        }}
        {...(!isMobile ? { ...listeners, ...attributes } : {})}
      >
        <span className="designer-plant-card-photo">
          {showPhoto ? (
            <img
              src={plant.image_url!}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className="designer-plant-card-photo-fallback"
              style={{ color: layer.stroke }}
              aria-hidden
            >
              {initial}
            </span>
          )}
          <span className="designer-plant-card-layer">
            {plant.canopy_layer}
          </span>
        </span>

        <span className="designer-plant-card-text">
          <span className="designer-plant-card-name">{plant.common_name}</span>
          <span className="designer-plant-card-scientific">
            {plant.scientific_name}
          </span>
        </span>

        <span className="designer-plant-card-chips">
          {sun && <span className="designer-plant-card-chip">{sun}</span>}
          {plant.water_needs && (
            <span className="designer-plant-card-chip">
              {plant.water_needs} water
            </span>
          )}
          {effectiveIsFloridaNative(plant) && (
            <span className="designer-plant-card-chip is-native">Native</span>
          )}
          {plant.is_invasive_in_florida && (
            <span className="designer-plant-card-chip is-warn">Invasive</span>
          )}
        </span>

        <span className="designer-plant-card-size">
          {height && <span>Tall {height}</span>}
          {spread && <span>Wide {spread}</span>}
        </span>
      </button>

      <button
        type="button"
        className="designer-plant-card-place"
        onClick={() => {
          armPlantPlacement(arming ? null : plant);
          if (isMobile && !arming) setSidebarOpen(false);
        }}
      >
        {arming ? "Tap the plan…" : "Place in garden"}
      </button>

      {isMobile && (
        <button
          type="button"
          className="designer-plant-card-grip"
          aria-label={`Drag ${plant.common_name} onto the canvas`}
          {...listeners}
          {...attributes}
        >
          <span aria-hidden>⠿</span>
        </button>
      )}
    </div>
  );
}
