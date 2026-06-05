import { useState } from "react";
import type { CanopyLayer, Plant } from "../../../types";
import { designerStateConfig } from "@lib/designer-states";
import { useDesignerStore } from "../../store/useDesignerStore";
import { canopyColor } from "../../lib/canopy-colors";
import { plantRoleTags, resolveCompanionPlant } from "../../lib/plant-detail-helpers";
import { GuildFunctionCards } from "./GuildFunctionCards";

export function PlantCatalogProfile({
  plant,
  companionNames,
  resolvedCompanions,
  companionReasons,
  reasonsLoading,
  onFindCompanion,
}: {
  plant: Plant;
  companionNames: string[];
  resolvedCompanions: {
    id: string;
    common_name: string;
    canopy_layer: CanopyLayer;
    image_url?: string | null;
  }[];
  companionReasons: Record<string, string>;
  reasonsLoading: boolean;
  onFindCompanion: (name: string) => void;
}) {
  const designerState = useDesignerStore((s) => s.designerState);
  const stateName =
    designerStateConfig(designerState)?.name ?? "your region";
  const roles = plantRoleTags(plant);
  const uses = plant.uses ?? [];
  const benefits = plant.benefits ?? [];
  const guildFns = plant.guild_functions ?? [];

  return (
    <>
      {roles.length > 0 && (
        <ul className="designer-detail-roles" aria-label="Guild roles">
          {roles.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      {guildFns.length > 0 && (
        <section className="designer-detail-block">
          <h3 className="designer-detail-block-title">What it does in the guild</h3>
          <GuildFunctionCards functions={guildFns} />
        </section>
      )}

      {benefits.length > 0 && (
        <section className="designer-detail-block">
          <h3 className="designer-detail-block-title">Why grow it</h3>
          <ul className="designer-detail-bullets">
            {benefits.slice(0, 5).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {uses.length > 0 && (
        <section className="designer-detail-block">
          <h3 className="designer-detail-block-title">Uses</h3>
          <p className="designer-detail-tags">{uses.join(" · ")}</p>
        </section>
      )}

      {companionNames.length > 0 && (
        <section className="designer-detail-block">
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
                  onFind={() => onFindCompanion(name)}
                />
              );
            })}
          </ul>
        </section>
      )}

      <p className="designer-detail-place-hint">
        Drag this plant onto the canvas to place it and add companions to your layout.
      </p>
    </>
  );
}

function CompanionPreviewItem({
  name,
  companion,
  layerColors,
  reason,
  reasonLoading,
  onFind,
}: {
  name: string;
  companion: {
    id: string;
    common_name: string;
    canopy_layer: CanopyLayer;
    image_url?: string | null;
  } | null | undefined;
  layerColors: { stroke: string } | null;
  reason?: string;
  reasonLoading: boolean;
  onFind: () => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const displayName = companion?.common_name ?? name;

  return (
    <li className="designer-detail-companion-preview-item">
      <div className="designer-detail-companion-preview-main">
        {companion?.image_url ? (
          <img src={companion.image_url} alt="" className="designer-detail-companion-mini" />
        ) : (
          <span
            className="designer-detail-companion-mini designer-detail-companion-mini--empty"
            style={layerColors ? { color: layerColors.stroke } : undefined}
          >
            {displayName.charAt(0)}
          </span>
        )}
        <div className="designer-detail-companion-row-text">
          <span className="designer-detail-companion-name">{displayName}</span>
          {companion ? (
            <span className="designer-detail-companion-layer">{companion.canopy_layer}</span>
          ) : (
            <button type="button" className="designer-detail-find-btn" onClick={onFind}>
              Find in plant list
            </button>
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
