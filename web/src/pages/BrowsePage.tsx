import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlants, fetchStates } from "../api";
import { CatalogHeader } from "../components/CatalogHeader";
import { PlantCard } from "../components/PlantCard";
import "../styles/catalog.css";
import { CloseIcon, SearchIcon, SlidersIcon, SproutIcon } from "../components/Icons";
import type { PlantSummary, UsStateOption } from "../types";

const STORAGE_STATE_KEY = "naturelover-my-state";

const CATEGORIES = [
  "",
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Berry",
  "Herb",
  "Vegetable",
  "Palm",
  "Native Shrub",
  "Vine",
] as const;

const CANOPY_LAYERS = [
  "",
  "Overstory",
  "Understory",
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Vine",
] as const;

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

export function BrowsePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [canopyLayer, setCanopyLayer] = useState("");
  const [edibleOnly, setEdibleOnly] = useState(false);
  const [myState, setMyState] = useState(
    () => localStorage.getItem(STORAGE_STATE_KEY) ?? "",
  );
  const [nativeToMyState, setNativeToMyState] = useState(false);
  const [states, setStates] = useState<UsStateOption[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (category) n++;
    if (canopyLayer) n++;
    if (edibleOnly) n++;
    if (nativeToMyState) n++;
    return n;
  }, [category, canopyLayer, edibleOnly, nativeToMyState]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (category) {
      chips.push({
        key: "category",
        label: category,
        clear: () => setCategory(""),
      });
    }
    if (canopyLayer) {
      chips.push({
        key: "layer",
        label: canopyLayer,
        clear: () => setCanopyLayer(""),
      });
    }
    if (edibleOnly) {
      chips.push({
        key: "edible",
        label: "Edible only",
        clear: () => setEdibleOnly(false),
      });
    }
    if (nativeToMyState) {
      chips.push({
        key: "native",
        label: `Native to ${stateName}`,
        clear: () => setNativeToMyState(false),
      });
    }
    return chips;
  }, [category, canopyLayer, edibleOnly, nativeToMyState, stateName]);

  const clearAllFilters = () => {
    setCategory("");
    setCanopyLayer("");
    setEdibleOnly(false);
    setNativeToMyState(false);
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
    if (myState) localStorage.setItem(STORAGE_STATE_KEY, myState);
    else localStorage.removeItem(STORAGE_STATE_KEY);
  }, [myState]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

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
          category: category || undefined,
          canopy_layer: canopyLayer || undefined,
          edible_only: edibleOnly,
          state: myState,
          native_to_state: nativeToMyState || undefined,
          for_my_area: nativeToMyState ? false : undefined,
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
    [debouncedSearch, category, canopyLayer, edibleOnly, myState, nativeToMyState],
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

  const filtersPanel = (
    <aside
      className={`filters-panel${filtersOpen ? " open" : ""}`}
      aria-label="Filters"
    >
      <div className="filters-panel-header">
        <h2>Refine results</h2>
        <button
          type="button"
          className="filters-close"
          onClick={() => setFiltersOpen(false)}
          aria-label="Close filters"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="filters-panel-body">
        <div className="filter-group">
          <p className="filter-group-title">Plant type</p>
          <label className="field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c || "all"} value={c}>
                  {c || "All categories"}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ marginTop: "0.65rem" }}>
            <span>Canopy layer</span>
            <select
              value={canopyLayer}
              onChange={(e) => setCanopyLayer(e.target.value)}
            >
              {CANOPY_LAYERS.map((l) => (
                <option key={l || "all"} value={l}>
                  {l || "All layers"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-group">
          <p className="filter-group-title">Range</p>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={nativeToMyState}
              onChange={(e) => setNativeToMyState(e.target.checked)}
            />
            <span className="toggle-copy">
              <strong>Native to my state only</strong>
              <span>
                Documented natives in {stateName || "your state"} — a smaller
                list than everything that can grow there.
              </span>
            </span>
          </label>
        </div>

        <div className="filter-group">
          <p className="filter-group-title">Harvest</p>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={edibleOnly}
              onChange={(e) => setEdibleOnly(e.target.checked)}
            />
            <span className="toggle-copy">
              <strong>Edible only</strong>
              <span>Fruits, herbs, and other food-bearing species.</span>
            </span>
          </label>
        </div>
      </div>
    </aside>
  );

  const resultsSummary =
    !myState ? null : loading && plants.length === 0 ? (
      "Loading catalog…"
    ) : (
      <>
        <strong>{total.toLocaleString()}</strong> plants
        {nativeToMyState ? (
          <> native to {stateName}</>
        ) : (
          <> that can grow in {stateName}</>
        )}
        {debouncedSearch && (
          <>
            {" "}
            matching &ldquo;{debouncedSearch}&rdquo;
          </>
        )}
      </>
    );

  return (
    <main className="browse-page">
      <CatalogHeader
        stateName={myState ? stateName : undefined}
        total={myState ? total : undefined}
        loading={myState ? loading && plants.length === 0 : false}
      />

      <section className="catalog-setup" id="get-started">
        <article className="catalog-setup-card" aria-labelledby="location-heading">
          <h2 id="location-heading">Where are you planting?</h2>
          <p>Pick your state to see plants that can grow in your area.</p>
          <label className="field">
            <span>State</span>
            <select
              value={myState}
              onChange={(e) => setMyState(e.target.value)}
            >
              <option value="">Select your state…</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {selectedState && (
            <p className="catalog-setup-hint">
              Showing plants that can grow in {stateName}.
            </p>
          )}
        </article>
      </section>

      {!myState && (
        <div className="catalog-prompt">
          <SproutIcon />
          <p>Select a state above to browse plants for your area.</p>
          <Link to="/">← Back to NTR LVR</Link>
          {" · "}
          <Link to="/designer">Open garden designer</Link>
        </div>
      )}

      {myState && (
        <section className="catalog-toolbar" aria-label="Search and filters">
          <div className="catalog-bar">
            <div className="search-bar">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search mango, pawpaw, nitrogen fixer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search plants"
              />
            </div>
            <div className="catalog-bar-row">
              <p className="results-summary">{resultsSummary}</p>
              <button
                type="button"
                className="filter-toggle"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
              >
                <SlidersIcon />
                Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>
            {activeChips.length > 0 && (
              <div className="active-filters">
                {activeChips.map((chip) => (
                  <span key={chip.key} className="filter-chip">
                    {chip.label}
                    <button
                      type="button"
                      onClick={chip.clear}
                      aria-label={`Remove ${chip.label} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="clear-filters"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <div
        className={`filter-backdrop${filtersOpen ? " open" : ""}`}
        onClick={() => setFiltersOpen(false)}
        aria-hidden={!filtersOpen}
      />

      {myState && (
        <div className="browse-body">
          {filtersPanel}

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
              <div className="empty-state">
                <SproutIcon />
                <h3>No plants match yet</h3>
                <p>
                  Try clearing filters or broadening your search. You can also
                  browse without the native-only filter.
                </p>
                {(activeChips.length > 0 || debouncedSearch) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setSearch("");
                      clearAllFilters();
                    }}
                  >
                    Reset search &amp; filters
                  </button>
                )}
              </div>
            )}

            {!error && plants.length > 0 && (
              <section className="plant-grid">
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
        </div>
      )}
    </main>
  );
}
