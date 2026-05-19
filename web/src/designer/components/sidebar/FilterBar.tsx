import type { FilterKey } from "../../types";
import { useDesignerStore } from "../../store/useDesignerStore";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "fruit_trees", label: "Fruit trees" },
  { key: "fruits_vegetables", label: "Fruits & veggies" },
  { key: "vines", label: "Vines" },
  { key: "herbs", label: "Herbs" },
  { key: "flowers", label: "Flowers" },
  { key: "support", label: "Support" },
  { key: "natives", label: "Natives" },
];

export function FilterBar() {
  const categoryFilter = useDesignerStore((s) => s.categoryFilter);
  const setCategoryFilter = useDesignerStore((s) => s.setCategoryFilter);

  return (
    <div className="designer-filters" role="group" aria-label="Plant category">
      <button
        type="button"
        className={`designer-pill${categoryFilter === null ? " active" : ""}`}
        onClick={() => setCategoryFilter(null)}
      >
        All
      </button>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`designer-pill${categoryFilter === f.key ? " active" : ""}`}
          onClick={() =>
            setCategoryFilter(categoryFilter === f.key ? null : f.key)
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
