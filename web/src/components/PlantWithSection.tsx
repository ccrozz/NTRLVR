import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CanopyLayer } from "../types";
import { canopyColor } from "../designer/lib/canopy-colors";
import { resolveCompanionPlant } from "../designer/lib/plant-detail-helpers";
import { useCompanionPlantsForState } from "../hooks/useCompanionPlantsForState";
import { useCompanionReasonsBatch } from "../hooks/useCompanionReasonsBatch";

type ResolvedCompanion = {
  id: string;
  common_name: string;
  canopy_layer: CanopyLayer;
  image_url?: string | null;
};

export function PlantWithSection({
  hostId,
  companionNames,
  stateCode,
  stateName,
  showCanvasHint = false,
  linkCompanions = false,
  onFindCompanion,
}: {
  hostId: string;
  companionNames: string[];
  stateCode: string;
  stateName: string;
  /** Designer sidebar — drag hint below the list. */
  showCanvasHint?: boolean;
  /** Link resolved companions to catalog detail pages. */
  linkCompanions?: boolean;
  /** Designer browse — jump to plant list when a companion is not in catalog. */
  onFindCompanion?: (name: string) => void;
}) {
  const { data: resolvedCompanions = [] } = useCompanionPlantsForState(
    companionNames,
    stateCode,
    companionNames.length > 0,
  );

  const companionIds = useMemo(
    () =>
      companionNames
        .map((name) => resolveCompanionPlant(name, resolvedCompanions)?.id)
        .filter((id): id is string => Boolean(id)),
    [companionNames, resolvedCompanions],
  );

  const { data: companionReasons = {}, isLoading: reasonsLoading } =
    useCompanionReasonsBatch(
      hostId,
      companionIds,
      companionIds.length > 0,
    );

  if (!companionNames.length) return null;

  return (
    <section className="designer-detail-block catalog-plant-with">
      <h3 className="designer-detail-block-title">Plant with</h3>
      <p className="designer-detail-hint">
        Good neighbors for this species in a {stateName} food forest.
      </p>
      <ul className="designer-detail-companion-preview">
        {companionNames.map((name) => {
          const match = resolveCompanionPlant(name, resolvedCompanions);
          const cp = match
            ? resolvedCompanions.find((p) => p.id === match.id)
            : null;
          const layerColors = cp ? canopyColor(cp.canopy_layer) : null;
          return (
            <CompanionPreviewItem
              key={name}
              name={name}
              companion={cp}
              layerColors={layerColors}
              reason={cp ? companionReasons[cp.id] : undefined}
              reasonLoading={
                reasonsLoading && Boolean(cp?.id) && !companionReasons[cp!.id]
              }
              onFind={onFindCompanion ? () => onFindCompanion(name) : undefined}
              linkCompanions={linkCompanions}
            />
          );
        })}
      </ul>
      {showCanvasHint && (
        <p className="designer-detail-place-hint">
          Drag this plant onto the canvas to place it and add companions to your
          layout.
        </p>
      )}
    </section>
  );
}

function CompanionPreviewItem({
  name,
  companion,
  layerColors,
  reason,
  reasonLoading,
  onFind,
  linkCompanions,
}: {
  name: string;
  companion: ResolvedCompanion | null | undefined;
  layerColors: { stroke: string } | null;
  reason?: string;
  reasonLoading: boolean;
  onFind?: () => void;
  linkCompanions: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const displayName = companion?.common_name ?? name;

  return (
    <li className="designer-detail-companion-preview-item">
      <div className="designer-detail-companion-preview-main">
        {companion?.image_url ? (
          <img
            src={companion.image_url}
            alt=""
            className="designer-detail-companion-mini"
          />
        ) : (
          <span
            className="designer-detail-companion-mini designer-detail-companion-mini--empty"
            style={layerColors ? { color: layerColors.stroke } : undefined}
          >
            {displayName.charAt(0)}
          </span>
        )}
        <div className="designer-detail-companion-row-text">
          {companion ? (
            linkCompanions ? (
              <Link
                to={`/plants/${companion.id}`}
                className="designer-detail-companion-name catalog-plant-with-link"
              >
                {displayName}
              </Link>
            ) : (
              <span className="designer-detail-companion-name">{displayName}</span>
            )
          ) : (
            <span className="designer-detail-companion-name">{displayName}</span>
          )}
          {companion ? (
            <span className="designer-detail-companion-layer">
              {companion.canopy_layer}
            </span>
          ) : onFind ? (
            <button
              type="button"
              className="designer-detail-find-btn"
              onClick={onFind}
            >
              Find in plant list
            </button>
          ) : (
            <span className="designer-detail-companion-layer">Not in catalog</span>
          )}
        </div>
        {companion && (
          <button
            type="button"
            className="designer-detail-companion-why"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((o) => !o)}
          >
            {whyOpen ? "Hide" : "Why?"}
          </button>
        )}
      </div>
      {whyOpen && companion && (
        <p className="designer-detail-companion-preview-why">
          {reason ||
            (reasonLoading ? "Loading…" : "No pairing note for this pair yet.")}
        </p>
      )}
    </li>
  );
}
