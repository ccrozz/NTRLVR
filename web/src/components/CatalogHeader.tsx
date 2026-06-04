import type { ReactNode } from "react";

export function CatalogHero({
  statePicker,
  stateName,
  total,
  loading,
}: {
  statePicker: ReactNode;
  stateName?: string;
  total?: number;
  loading?: boolean;
}) {
  return (
    <header className="catalog-hero">
      <div className="catalog-hero-copy">
        <p className="catalog-hero-kicker">Plant catalog</p>
        <h1>Find plants that can grow where you live</h1>
        <p className="catalog-hero-lead">
          No gardening degree required — choose your state, tap a category, and
          open any plant for a plain-English growing guide.
        </p>
        <ol className="catalog-hero-steps">
          <li>
            <span className="catalog-step-num" aria-hidden>
              1
            </span>
            <span>Pick your state</span>
          </li>
          <li>
            <span className="catalog-step-num" aria-hidden>
              2
            </span>
            <span>Browse or search the list</span>
          </li>
          <li>
            <span className="catalog-step-num" aria-hidden>
              3
            </span>
            <span>Open a plant for growing tips</span>
          </li>
        </ol>
      </div>

      <div className="catalog-hero-panel">
        <div className="catalog-hero-panel-head">
          <h2 id="location-heading">Where are you planting?</h2>
          {stateName && !loading && total != null && (
            <span className="catalog-hero-count">
              {total.toLocaleString()} matches
            </span>
          )}
        </div>
        {statePicker}
        {stateName ? (
          <p className="catalog-hero-confirmed">
            Showing plants for <strong>{stateName}</strong> — matched to your
            climate and growing zones.
          </p>
        ) : (
          <p className="catalog-hero-hint">
            Your list updates as soon as you choose a state.
          </p>
        )}
      </div>
    </header>
  );
}
