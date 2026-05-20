import { useMemo } from "react";
import type { Plant } from "../../../types";
import { useCompanionReason, type ReasonPlantPayload } from "../../hooks/useCompanionReason";

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

export function AvoidCard({
  host,
  other,
}: {
  host: Plant;
  other: Plant;
}) {
  const hostPayload = useMemo(() => toReasonPayload(host), [host]);
  const otherPayload = useMemo(() => toReasonPayload(other), [other]);

  const { data: reason, isLoading } = useCompanionReason(
    hostPayload,
    otherPayload,
    true,
    true,
    true,
  );

  return (
    <article className="detail-avoid-card">
      <div className="detail-avoid-head">
        <span className="detail-avoid-icon" aria-hidden>
          ⚠️
        </span>
        <div>
          <strong>{other.common_name}</strong>
          <em>{other.scientific_name}</em>
        </div>
      </div>
      <div className="detail-companion-why">
        {isLoading ? (
          <>
            <p className="detail-skeleton detail-skeleton--text" />
            <p className="detail-asking">Asking the garden…</p>
          </>
        ) : (
          <p className="detail-companion-reason">{reason}</p>
        )}
      </div>
    </article>
  );
}
