import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlants, fetchStates } from "../api";
import { CatalogCategoryFilters } from "../components/CatalogCategoryFilters";
import { CatalogHero } from "../components/CatalogHeader";
import { CatalogQuickPicks } from "../components/CatalogQuickPicks";
import { PlantCard } from "../components/PlantCard";
import {
  catalogGroupFiltersForState,
  type CatalogGroupFilter,
} from "../lib/catalog-category-filters";
import { nativesGroupLabel } from "@lib/food-forest-groups";
import "../styles/catalog.css";
import { SearchIcon, SproutIcon } from "../components/Icons";
import {
  CATALOG_STATE_STORAGE_KEY,
  writeCatalogStateCode,
} from "../lib/catalog-state";
import type { PlantSummary, UsStateOption } from "../types";

const PAGE_SIZE = 24;

function SkeletonGrid() {
  return (
    <div className="skeleton-grid" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

function activeFilterLabel(
  groupFilter: CatalogGroupFilter | null,
  edibleOnly: boolean,
  nativeToMyState: boolean,
  groupFilters: { key: CatalogGroupFilter; label: string }[],
): string | null {
  const parts: string[] = [];
  if (edibleOnly) parts.push("Something to eat");
  if (nativeToMyState) parts.push("Natives only");
  if (groupFilter) {
    const label = groupFilters.find((f) => f.key === groupFilter)?.label;
    if (label) parts.push(label);
  }
  if (!parts.length) return null;
  return parts.join(" · ");
}

export function BrowsePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<CatalogGroupFilter | null>(
    null,
  );
  const [edibleOnly, setEdibleOnly] = useState(false);
  const [myState, setMyState] = useState(
    () => localStorage.getItem(CATALOG_STATE_STORAGE_KEY) ?? "",
  );
  const [nativeToMyState, setNativeToMyState] = useState(false);
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [states, setStates] = useState<UsStateOption[]>([]);

  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  const selectedState = useMemo(
    () => states.find((s) => s.code === myState),
    [states, myState],
  );

  const stateName = selectedState?.name ?? myState;

  const groupFilters = useMemo(
    () => catalogGroupFiltersForState(myState || "FL"),
    [myState],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        groupFilter ||
          edibleOnly ||
          nativeToMyState ||
          showFullCatalog ||
          debouncedSearch,
      ),
    [groupFilter, edibleOnly, nativeToMyState, showFullCatalog, debouncedSearch],
  );

  const filterSummary = useMemo(
    () =>
      activeFilterLabel(
        groupFilter,
        edibleOnly,
        nativeToMyState,
        groupFilters,
      ),
    [groupFilter, edibleOnly, nativeToMyState, groupFilters],
  );

  const clearAllFilters = () => {
    setSearch("");
    setGroupFilter(null);
    setEdibleOnly(false);
    setNativeToMyState(false);
    setShowFullCatalog(false);
  };

  const handleEdibleLens = (on: boolean) => {
    setEdibleOnly(on);
    if (!on) return;
    if (groupFilter === "flowers" || groupFilter === "support") {
      setGroupFilter("fruits_vegetables");
      return;
    }
    if (!groupFilter) setGroupFilter("fruits_vegetables");
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    writeCatalogStateCode(myState);
  }, [myState]);

  const load = useCallback(
    async (append: boolean, nextOffset: number) => {
      if (!myState) {
        setPlants([]);
        setTotal(0);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        setError(null);
        return;
      }

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetchPlants({
          search: debouncedSearch || undefined,
          food_forest_group: groupFilter ?? undefined,
          edible_only: edibleOnly,
          state: myState,
          native_to_state: nativeToMyState || undefined,
          for_my_area: !nativeToMyState && !showFullCatalog,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        setPlants((prev) => (append ? [...prev, ...res.data] : res.data));
        setTotal(res.meta.total);
        setHasMore(res.meta.has_more);
        setOffset(nextOffset);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plants");
        if (!append) setPlants([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, groupFilter, edibleOnly, myState, nativeToMyState, showFullCatalog],
  );

  useEffect(() => {
    load(false, 0);
  }, [load]);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel || !hasMore || error || !myState) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loading || loadingMore) return;
        load(true, offset + PAGE_SIZE);
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, offset, load, error, myState]);

  const resultsLine =
    !myState ? null : loading && plants.length === 0 ? (
      "Finding plants for your area…"
    ) : (
      <>
        <strong>{total.toLocaleString()}</strong>
        {edibleOnly ? (
          <> edible picks in {stateName}</>
        ) : nativeToMyState ? (
          <> natives in {stateName}</>
        ) : showFullCatalog ? (
          <> plants in the full catalog</>
        ) : (
          <> plants for {stateName}</>
        )}
        {debouncedSearch && (
          <>
            {" "}
            matching &ldquo;{debouncedSearch}&rdquo;
          </>
        )}
      </>
    );

  const statePicker = (
    <label className="catalog-state-field">
      <span className="catalog-state-label">State</span>
      <select
        value={myState}
        onChange={(e) => setMyState(e.target.value)}
        aria-labelledby="location-heading"
      >
        <option value="">Select your state…</option>
        {states.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <main className="browse-page catalog-browse">
      <CatalogHero
        statePicker={statePicker}
        stateName={myState ? stateName : undefined}
        total={myState ? total : undefined}
        loading={myState ? loading && plants.length === 0 : false}
      />

      {!myState && (
        <div className="catalog-prompt">
          <SproutIcon />
          <h2>Choose a state to get started</h2>
          <p>
            We filter thousands of plants down to what fits your climate — so
            you are not scrolling through species that will not survive winter.
          </p>
          <Link to="/designer" className="btn btn-primary">
            Or design a garden layout
          </Link>
        </div>
      )}

      {myState && (
        <>
          <div className="catalog-sticky-dock" aria-label="Search and filters">
            <div className="catalog-dock-search search-bar">
              <SearchIcon />
              <input
                type="search"
                placeholder="Try tomato, apple, bee balm…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search plants"
              />
            </div>

            <div className="catalog-dock-section">
              <p className="catalog-dock-label">What are you looking for?</p>
              <CatalogCategoryFilters
                filters={groupFilters}
                active={groupFilter}
                onSelect={setGroupFilter}
                className="catalog-dock-categories"
              />
            </div>

            <div className="catalog-dock-section">
              <p className="catalog-dock-label">Popular starting points</p>
              <CatalogQuickPicks
                nativesLabel={nativesGroupLabel(myState)}
                edibleOnly={edibleOnly}
                onEdibleOnly={handleEdibleLens}
                nativeToMyState={nativeToMyState}
                onNativeToMyState={setNativeToMyState}
                showFullCatalog={showFullCatalog}
                onShowFullCatalog={setShowFullCatalog}
              />
            </div>

            <div className="catalog-dock-footer">
              <p className="catalog-dock-results">{resultsLine}</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="catalog-dock-clear"
                  onClick={clearAllFilters}
                >
                  {filterSummary ? `Clear: ${filterSummary}` : "Clear filters"}
                </button>
              )}
            </div>
          </div>

          <section className="catalog-main">
            {error && (
              <div className="error-state">
                <SproutIcon />
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => load(false, 0)}
                >
                  Try again
                </button>
              </div>
            )}

            {!error && loading && plants.length === 0 && <SkeletonGrid />}

            {!error && !loading && plants.length === 0 && (
              <div className="empty-state catalog-empty">
                <SproutIcon />
                <h3>No plants match yet</h3>
                <p>
                  Try <strong>All</strong> plants, pick a different category, or
                  clear your filters above.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {!error && plants.length > 0 && (
              <section className="plant-grid" aria-label="Plant results">
                {plants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    myStateCode={myState}
                    myStateName={stateName}
                    showZones={false}
                  />
                ))}
              </section>
            )}

            <div ref={scrollSentinelRef} className="scroll-sentinel" aria-hidden>
              {loadingMore && (
                <p className="scroll-loading">
                  <span className="spinner" />
                  Loading more plants…
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
