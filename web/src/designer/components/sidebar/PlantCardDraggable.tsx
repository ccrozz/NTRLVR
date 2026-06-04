import { effectiveIsFloridaNative } from "@lib/plant-native-status";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { shouldIgnoreSidebarPlantClick } from "../../lib/designer-drag-drop";
import { canopyColor } from "../../lib/canopy-colors";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";
import type { PlantListItem } from "../../types";

export function PlantCardDraggable({
  plant,
  selected,
  onSelect,
  recommendation,
}: {
  plant: PlantListItem;
  selected: boolean;
  onSelect: () => void;
  recommendation?: {
    priorityLabel: string;
    why: string;
    placementNote: string;
  };
}) {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plant-${plant.id}`,
    data: { plant },
  });

  const layer = canopyColor(plant.canopy_layer);
  const initial = plant.common_name.trim().charAt(0).toUpperCase() || "?";
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(plant.image_url) && !imgFailed;

  return (
    <div
      ref={setNodeRef}
      className={`designer-plant-row${selected ? " selected" : ""}${recommendation ? " designer-plant-row--rec" : ""}${isDragging ? " designer-plant-row--dragging" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title={recommendation?.placementNote}
    >
      {isMobile && (
        <button
          type="button"
          className="designer-plant-row-handle"
          aria-label={`Drag ${plant.common_name} onto the canvas`}
          {...listeners}
          {...attributes}
        >
          <span className="designer-plant-row-handle-grip" aria-hidden>
            ⠿
          </span>
        </button>
      )}
      <button
        type="button"
        className="designer-plant-row-main"
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
        <div className="designer-plant-row-thumb" aria-hidden>
          {showPhoto ? (
            <img
              src={plant.image_url!}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className="designer-plant-row-thumb--empty"
              style={{ color: layer.stroke }}
            >
              {initial}
            </span>
          )}
        </div>
        {recommendation && (
          <span
            className="designer-plant-row-priority"
            aria-label={`Priority ${recommendation.priorityLabel}`}
          >
            {recommendation.priorityLabel}.
          </span>
        )}
        <div className="designer-plant-row-text">
          <span className="designer-plant-row-name">{plant.common_name}</span>
          {isMobile && !recommendation && (
            <span className="designer-plant-row-profile-hint">Tap for profile</span>
          )}
          {recommendation ? (
            <>
              <span className="designer-plant-row-scientific">
                {plant.scientific_name}
              </span>
              <span className="designer-plant-row-why">{recommendation.why}</span>
              <span className="designer-plant-row-placement">
                {recommendation.placementNote}
              </span>
            </>
          ) : (
            <span className="designer-plant-row-meta">
              {plant.canopy_layer}
              {effectiveIsFloridaNative(plant) && " · Native"}
              {plant.is_invasive_in_florida && " · Invasive"}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
