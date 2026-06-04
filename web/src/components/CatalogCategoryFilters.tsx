import type { CatalogGroupFilter } from "../lib/catalog-category-filters";

export function CatalogCategoryFilters({
  filters,
  active,
  onSelect,
  className = "",
}: {
  filters: { key: CatalogGroupFilter; label: string }[];
  active: CatalogGroupFilter | null;
  onSelect: (key: CatalogGroupFilter | null) => void;
  className?: string;
}) {
  return (
    <div
      className={`catalog-category-filters${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Plant category"
    >
      <button
        type="button"
        className={`catalog-category-pill${active === null ? " is-active" : ""}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`catalog-category-pill${active === f.key ? " is-active" : ""}`}
          onClick={() => onSelect(active === f.key ? null : f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
