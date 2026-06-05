import { useState } from "react";
import type { CatalogPlantGuide } from "../lib/catalog-plant-guide";

export function CatalogPlantGuideSection({ guide }: { guide: CatalogPlantGuide }) {
  const [open, setOpen] = useState(false);
  const panelId = "catalog-guide-panel";

  return (
    <section
      className={`detail-section catalog-plant-guide${open ? " is-open" : ""}`}
      aria-labelledby="catalog-guide-heading"
    >
      <button
        type="button"
        className="catalog-guide-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="catalog-guide-toggle-text">
          <span className="catalog-guide-kicker">
            {guide.stateName
              ? `New to gardening in ${guide.stateName}?`
              : "New to gardening?"}
          </span>
          <h2 id="catalog-guide-heading" className="catalog-guide-title">
            {guide.stateName ? `How to grow it in ${guide.stateName}` : "How to grow it"}
          </h2>
          {!open && <span className="catalog-guide-teaser">{guide.intro}</span>}
        </span>
        <span className="catalog-guide-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      <div id={panelId} className="catalog-guide-body" hidden={!open}>
        <p className="catalog-guide-intro">{guide.intro}</p>

        <div className="catalog-guide-blocks">
          {guide.blocks.map((block) => (
            <article key={block.title} className="catalog-guide-block">
              <h3>{block.title}</h3>
              {block.body && <p>{block.body}</p>}
              {block.items && block.items.length > 0 && (
                <ul className="detail-list">
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
