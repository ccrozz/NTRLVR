import type { CatalogPlantGuide } from "../lib/catalog-plant-guide";

export function CatalogPlantGuideSection({ guide }: { guide: CatalogPlantGuide }) {
  return (
    <section className="detail-section catalog-plant-guide" aria-labelledby="catalog-guide-heading">
      <p className="catalog-guide-kicker">
        {guide.stateName
          ? `New to gardening in ${guide.stateName}?`
          : "New to gardening?"}
      </p>
      <h2 id="catalog-guide-heading">
        {guide.stateName ? `How to grow it in ${guide.stateName}` : "How to grow it"}
      </h2>
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
    </section>
  );
}
