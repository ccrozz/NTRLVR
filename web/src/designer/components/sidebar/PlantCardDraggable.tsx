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
      className={`designer-plant-card${selected ? " selected" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onSelect}
      {...listeners}
      {...attributes}
    >
      <div className="designer-card-media" aria-hidden>
        {showPhoto ? (
          <img
            src={plant.image_url!}
            alt=""
            className="designer-card-thumb"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="designer-card-thumb designer-card-thumb--placeholder">
            {initial}
          </span>
        )}
        <span
          className="designer-layer-dot"
          style={{ background: layer.stroke }}
        />
      </div>
      <div className="designer-card-body">
        <h3>{plant.common_name}</h3>
        <p className="sci">{plant.scientific_name}</p>
        <div className="designer-badges">
          {plant.is_florida_native && (
            <span className="designer-badge designer-badge-native">Native</span>
          )}
          {plant.is_invasive_in_florida && (
            <span className="designer-badge designer-badge-warn">Invasive</span>
          )}
          {plant.source === "trefle" && (
            <span className="designer-badge designer-badge-trefle">Trefle</span>
          )}
        </div>
      </div>
    </button>
  );
}
