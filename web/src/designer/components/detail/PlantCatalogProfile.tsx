import type { Plant } from "../../../types";
import { designerStateConfig } from "@lib/designer-states";
import { useDesignerStore } from "../../store/useDesignerStore";
import { plantRoleTags } from "../../lib/plant-detail-helpers";
import { PlantWithSection } from "../../../components/PlantWithSection";
import { GuildFunctionCards } from "./GuildFunctionCards";

export function PlantCatalogProfile({
  plant,
  companionNames,
  onFindCompanion,
}: {
  plant: Plant;
  companionNames: string[];
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

      <PlantWithSection
        hostId={plant.id}
        companionNames={companionNames}
        stateCode={designerState}
        stateName={stateName}
        showCanvasHint
        onFindCompanion={onFindCompanion}
      />
    </>
  );
}
