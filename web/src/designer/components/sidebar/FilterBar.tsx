import { useEffect, useState } from "react";
import { nativesGroupLabel } from "@lib/food-forest-groups";
import type { FilterKey } from "../../types";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";
import { useDesignerStore } from "../../store/useDesignerStore";

const BASE_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "fruit_trees", label: "Fruit trees" },
  { key: "fruits_vegetables", label: "Fruits & veggies" },
  { key: "herbs", label: "Herbs" },
  { key: "medicinal_herbs", label: "Medicinal herbs" },
  { key: "flowers", label: "Flowers" },
  { key: "support", label: "Support" },
  { key: "natives", label: "Natives" },
];

function FilterPills({
  filters,
  categoryFilter,
  onSelect,
  className = "",
  id,
}: {
  filters: { key: FilterKey; label: string }[];
  categoryFilter: FilterKey | null;
  onSelect: (key: FilterKey | null) => void;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={className} role="group" aria-label="Plant category">
      <button
        type="button"
        className={`designer-pill${categoryFilter === null ? " active" : ""}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`designer-pill${categoryFilter === f.key ? " active" : ""}`}
          onClick={() => onSelect(categoryFilter === f.key ? null : f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar() {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoryFilter = useDesignerStore((s) => s.categoryFilter);
  const setCategoryFilter = useDesignerStore((s) => s.setCategoryFilter);
  const designerState = useDesignerStore((s) => s.designerState);
  const filters = BASE_FILTERS.map((f) =>
    f.key === "natives"
      ? { ...f, label: nativesGroupLabel(designerState) }
      : f,
  );

  const activeLabel =
    categoryFilter === null
      ? "All plants"
      : (filters.find((f) => f.key === categoryFilter)?.label ?? "Filtered");

  function pickCategory(key: FilterKey | null) {
    setCategoryFilter(key);
    if (isMobile) setCategoriesOpen(false);
  }

  useEffect(() => {
    if (!isMobile) setCategoriesOpen(false);
  }, [isMobile]);

  if (!isMobile) {
    return (
      <FilterPills
        className="designer-filters"
        filters={filters}
        categoryFilter={categoryFilter}
        onSelect={pickCategory}
      />
    );
  }

  return (
    <div
      className={`designer-filters designer-filters--mobile${categoriesOpen ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="designer-filters-toggle"
        aria-expanded={categoriesOpen}
        aria-controls="designer-filters-panel"
        onClick={() => setCategoriesOpen((open) => !open)}
      >
        <span className="designer-filters-toggle-text">
          <span className="designer-filters-toggle-kicker">Category</span>
          <span className="designer-filters-toggle-value">{activeLabel}</span>
        </span>
        <span className="designer-filters-toggle-action" aria-hidden>
          {categoriesOpen ? "Hide" : "Change"}
        </span>
        <span className="designer-filters-toggle-chevron" aria-hidden>
          {categoriesOpen ? "▴" : "▾"}
        </span>
      </button>
      {categoriesOpen && (
        <FilterPills
          id="designer-filters-panel"
          className="designer-filters-panel"
          filters={filters}
          categoryFilter={categoryFilter}
          onSelect={pickCategory}
        />
      )}
    </div>
  );
}
