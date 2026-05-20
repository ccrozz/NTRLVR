import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDesignerStore } from "../../store/useDesignerStore";
import { usePlants } from "../../hooks/usePlants";
import { FilterBar } from "./FilterBar";
import { PlantCardDraggable } from "./PlantCardDraggable";
import { LayerVisibilityPanel } from "./LayerVisibilityPanel";

export function PlantSidebar() {
  const searchQuery = useDesignerStore((s) => s.searchQuery);
  const setSearchQuery = useDesignerStore((s) => s.setSearchQuery);
  const categoryFilter = useDesignerStore((s) => s.categoryFilter);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectSidebarPlant = useDesignerStore((s) => s.selectSidebarPlant);

  const [debounced, setDebounced] = useState(searchQuery);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePlants(debounced, categoryFilter);

  const plants = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root, rootMargin: "120px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, plants.length]);

  return (
    <aside className="designer-sidebar">
      <div className="designer-sidebar-top">
        <input
          className="designer-search"
          type="search"
          placeholder="Find a plant…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search plants"
        />
        <FilterBar />
      </div>

      <div className="designer-plant-list" ref={listRef}>
        {isLoading && (
          <p className="designer-plant-list-status">Loading plants…</p>
        )}
        {!isLoading && plants.length === 0 && (
          <p className="designer-plant-list-status">No plants match.</p>
        )}
        {plants.map((plant) => (
          <PlantCardDraggable
            key={plant.id}
            plant={plant}
            selected={selectedPlantId === plant.id}
            onSelect={() => selectSidebarPlant(plant.id)}
          />
        ))}
        <div ref={sentinelRef} className="designer-list-sentinel" aria-hidden>
          {isFetchingNextPage && (
            <p className="designer-plant-list-status">Loading more…</p>
          )}
        </div>
      </div>

      <footer className="designer-sidebar-footer">
        <LayerVisibilityPanel />
        {!isLoading && total > 0 && (
          <p className="designer-sidebar-count">
            {plants.length < total
              ? `${plants.length} of ${total}`
              : `${total} plants`}
          </p>
        )}
        <Link to="/catalog" className="designer-sidebar-catalog">
          Full catalog
        </Link>
      </footer>
    </aside>
  );
}
