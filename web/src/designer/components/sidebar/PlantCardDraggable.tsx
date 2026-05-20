import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { canopyColor } from "../../lib/canopy-colors";
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plant-${plant.id}`,
    data: { plant },
  });

  const layer = canopyColor(plant.canopy_layer);
  const initial = plant.common_name.trim().charAt(0).toUpperCase() || "?";
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(plant.image_url) && !imgFailed;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`designer-plant-row${selected ? " selected" : ""}${recommendation ? " designer-plant-row--rec" : ""}`}
      style={{ opacity: isDragging ? 0.45 : 1 }}
      onClick={onSelect}
      title={recommendation?.placementNote}
      {...listeners}
      {...attributes}
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
            {plant.is_florida_native && " · Native"}
            {plant.is_invasive_in_florida && " · Invasive"}
          </span>
        )}
      </div>
    </button>
  );
}
