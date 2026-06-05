import { Link } from "react-router-dom";
import { designerStateConfig } from "@lib/designer-states";
import { catalogDesignerPlantUrl, catalogDesignerStateCode } from "../lib/catalog-designer-link";
import { useCatalogStateCode } from "../lib/catalog-state";

export function CatalogDesignerPlantCta({
  plantId,
  plantName,
}: {
  plantId: string;
  plantName: string;
}) {
  const catalogState = useCatalogStateCode();
  const designerState = catalogDesignerStateCode(catalogState);
  const stateName = designerStateConfig(designerState)?.name ?? "your region";
  const href = catalogDesignerPlantUrl(plantId, catalogState);

  return (
    <Link to={href} className="catalog-designer-cta">
      <span className="catalog-designer-cta-copy">
        <span className="catalog-designer-cta-kicker">Food forest designer</span>
        <span className="catalog-designer-cta-title">
          Design with {plantName}
        </span>
        <span className="catalog-designer-cta-body">
          Opens the {stateName} designer and places {plantName} on your canvas so
          you can adjust spacing and explore companions.
        </span>
      </span>
      <span className="catalog-designer-cta-action" aria-hidden>
        Open designer →
      </span>
    </Link>
  );
}
