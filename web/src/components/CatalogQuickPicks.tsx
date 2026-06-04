export type CatalogQuickPicksProps = {
  nativesLabel: string;
  edibleOnly: boolean;
  onEdibleOnly: (on: boolean) => void;
  nativeToMyState: boolean;
  onNativeToMyState: (on: boolean) => void;
  showFullCatalog: boolean;
  onShowFullCatalog: (on: boolean) => void;
};

export function CatalogQuickPicks({
  nativesLabel,
  edibleOnly,
  onEdibleOnly,
  nativeToMyState,
  onNativeToMyState,
  showFullCatalog,
  onShowFullCatalog,
}: CatalogQuickPicksProps) {
  return (
    <div className="catalog-quick-picks" role="group" aria-label="Quick picks">
      <button
        type="button"
        className={`catalog-quick-pick${edibleOnly ? " is-active" : ""}`}
        aria-pressed={edibleOnly}
        onClick={() => onEdibleOnly(!edibleOnly)}
      >
        <span className="catalog-quick-pick-text">
          <span className="catalog-quick-pick-title">Something to eat</span>
          <span className="catalog-quick-pick-hint">Veggies, fruit &amp; herbs</span>
        </span>
      </button>

      <button
        type="button"
        className={`catalog-quick-pick${nativeToMyState ? " is-active" : ""}`}
        aria-pressed={nativeToMyState}
        onClick={() => onNativeToMyState(!nativeToMyState)}
      >
        <span className="catalog-quick-pick-text">
          <span className="catalog-quick-pick-title">{nativesLabel}</span>
          <span className="catalog-quick-pick-hint">Wildlife-friendly picks</span>
        </span>
      </button>

      <button
        type="button"
        className={`catalog-quick-pick${showFullCatalog ? " is-active" : ""}`}
        aria-pressed={showFullCatalog}
        onClick={() => onShowFullCatalog(!showFullCatalog)}
      >
        <span className="catalog-quick-pick-text">
          <span className="catalog-quick-pick-title">Full US catalog</span>
          <span className="catalog-quick-pick-hint">
            Skip climate filter — browse everything
          </span>
        </span>
      </button>
    </div>
  );
}
