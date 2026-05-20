import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { PlantSummary } from "../../../types";
import { useDesignerStore } from "../../store/useDesignerStore";

export function CompanionSuggestionRow({
  companion,
  hostCanvasId,
  slotIndex,
  totalSlots,
  reason,
  reasonLoading = false,
  alreadyPlaced = false,
}: {
  companion: PlantSummary;
  hostCanvasId: string;
  slotIndex: number;
  totalSlots: number;
  reason: string;
  reasonLoading?: boolean;
  alreadyPlaced?: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const addPlantNearHost = useDesignerStore((s) => s.addPlantNearHost);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `detail-companion-${companion.id}`,
    data: { plant: companion },
  });

  return (
    <div
      ref={setNodeRef}
      className="designer-detail-companion-row"
      style={{ opacity: isDragging ? 0.45 : 1 }}
    >
      <div
        className="designer-detail-companion-row-main designer-detail-companion-draggable"
        {...listeners}
        {...attributes}
      >
        {companion.image_url ? (
          <img src={companion.image_url} alt="" className="designer-detail-companion-mini" />
        ) : (
          <span className="designer-detail-companion-mini designer-detail-companion-mini--empty">
            {companion.common_name.charAt(0)}
          </span>
        )}
        <div className="designer-detail-companion-row-text">
          <span className="designer-detail-companion-name">{companion.common_name}</span>
          <span className="designer-detail-companion-layer">
            {companion.canopy_layer}
            {alreadyPlaced ? " · on canvas" : " · tap + to place"}
          </span>
        </div>
        <div className="designer-detail-companion-row-actions">
          <button
            type="button"
            className="designer-detail-companion-why"
            aria-expanded={whyOpen}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setWhyOpen((o) => !o)}
          >
            {whyOpen ? "Hide" : "Why?"}
          </button>
          <button
            type="button"
            className="designer-detail-companion-add-btn"
            title={`Place ${companion.common_name} in recommended spot`}
            aria-label={`Add ${companion.common_name} near host`}
            disabled={alreadyPlaced}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              addPlantNearHost(hostCanvasId, companion, slotIndex, totalSlots)
            }
          >
            +
          </button>
        </div>
      </div>
      {whyOpen && (
        <div className="designer-detail-companion-why-body">
          <p>
            {reason ||
              (reasonLoading ? "Loading…" : "No pairing note for this pair yet.")}
          </p>
        </div>
      )}
    </div>
  );
}
