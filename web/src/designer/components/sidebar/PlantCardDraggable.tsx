import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { canopyColor } from "../../lib/canopy-colors";
import type { PlantListItem } from "../../types";

export function PlantCardDraggable({
  plant,
  selected,
  onSelect,
}: {
  plant: PlantListItem;
  selected: boolean;
  onSelect: () => void;
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
      className={`designer-plant-row${selected ? " selected" : ""}`}
      style={{ opacity: isDragging ? 0.45 : 1 }}
      onClick={onSelect}
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
      <div className="designer-plant-row-text">
        <span className="designer-plant-row-name">{plant.common_name}</span>
        <span className="designer-plant-row-meta">
          {plant.canopy_layer}
          {plant.is_florida_native && " · Native"}
          {plant.is_invasive_in_florida && " · Invasive"}
        </span>
      </div>
    </button>
  );
}
