import { useEffect, useState } from "react";
import type { DesignerStateCode } from "@lib/designer-states";
import type { Plant } from "../../../types";
import {
  buildCatalogPlantGuide,
  guideContextForStateCode,
} from "../../../lib/catalog-plant-guide";

export function DesignerPlantGuide({
  plant,
  stateCode,
}: {
  plant: Plant;
  stateCode: DesignerStateCode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [plant.id]);

  const guide = buildCatalogPlantGuide(
    plant,
    guideContextForStateCode(stateCode),
  );
  const panelId = `designer-guide-panel-${plant.id}`;

  return (
    <section className={`designer-detail-guide${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="designer-detail-guide-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="designer-detail-guide-toggle-text">
          <span className="designer-detail-guide-kicker">
            {guide.stateName
              ? `New to gardening in ${guide.stateName}?`
              : "New to gardening?"}
          </span>
          <span className="designer-detail-guide-title">
            {guide.stateName
              ? `How to grow it in ${guide.stateName}`
              : "How to grow it"}
          </span>
          {!open && (
            <span className="designer-detail-guide-teaser">{guide.intro}</span>
          )}
        </span>
        <span className="designer-detail-guide-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      <div
        id={panelId}
        className="designer-detail-guide-body"
        hidden={!open}
      >
        <p className="designer-detail-guide-intro">{guide.intro}</p>

        <div className="designer-detail-guide-blocks">
          {guide.blocks.map((block) => (
            <article key={block.title} className="designer-detail-guide-block">
              <h4>{block.title}</h4>
              {block.body && <p>{block.body}</p>}
              {block.items && block.items.length > 0 && (
                <ul className="designer-detail-guide-list">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
