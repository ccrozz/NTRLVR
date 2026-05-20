import { useMemo } from "react";
import type { Plant } from "../../../types";
import { canopyColor } from "../../lib/canopy-colors";
import { useCompanionReason, type ReasonPlantPayload } from "../../hooks/useCompanionReason";
import { useDesignerStore } from "../../store/useDesignerStore";

function toReasonPayload(plant: Plant): ReasonPlantPayload {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    guild_functions: plant.guild_functions ?? [],
    canopy_layer: plant.canopy_layer,
    category: plant.category,
  };
}

export function CompanionCard({
  host,
  companion,
  hostCanvasId,
}: {
  host: Plant;
  companion: Plant;
  hostCanvasId: string | null;
}) {
  const addPlantNearHost = useDesignerStore((s) => s.addPlantNearHost);
  const layer = canopyColor(companion.canopy_layer);

  const hostPayload = useMemo(() => toReasonPayload(host), [host]);
  const companionPayload = useMemo(() => toReasonPayload(companion), [companion]);

  const { data: reason, isLoading, isError } = useCompanionReason(
    hostPayload,
    companionPayload,
    false,
    true,
  );

  return (
    <article className="detail-companion-card">
      <div className="detail-companion-head">
        {companion.image_url ? (
          <img
            src={companion.image_url}
            alt=""
            className="detail-companion-thumb"
          />
        ) : (
          <div
            className="detail-companion-thumb detail-companion-thumb--empty"
            style={{ borderColor: layer.stroke }}
          >
            {companion.common_name.charAt(0)}
          </div>
        )}
        <div className="detail-companion-titles">
          <strong>{companion.common_name}</strong>
          <em>{companion.scientific_name}</em>
          <span
            className="designer-badge"
            style={{
              borderColor: layer.stroke,
              color: layer.stroke,
            }}
          >
            {companion.canopy_layer}
          </span>
        </div>
      </div>

      <div className="detail-companion-why">
        <span className="designer-detail-companion-label">
          Why they belong together
        </span>
        {isLoading && (
          <>
            <p className="detail-skeleton detail-skeleton--text" />
            <p className="detail-skeleton detail-skeleton--text detail-skeleton--short" />
            <p className="detail-asking">Asking the garden…</p>
          </>
        )}
        {!isLoading && (
          <p className="detail-companion-reason">
            {isError
              ? "We couldn't fetch custom advice right now — try again in a moment."
              : reason}
          </p>
        )}
      </div>

      {hostCanvasId && (
        <button
          type="button"
          className="detail-companion-add"
          onClick={() => addPlantNearHost(hostCanvasId, companion)}
        >
          Add near this plant
        </button>
      )}
    </article>
  );
}
