import { useMemo } from "react";
import { EvergreenInstallCta } from "../../../components/EvergreenInstallCta";
import { focusDesignerCanvas } from "../../lib/focus-designer-canvas";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useRecommendedPlants } from "../../hooks/useRecommendedPlants";
import { PlantCardDraggable } from "./PlantCardDraggable";
import { RecommendationHeader } from "./RecommendationHeader";
import { ZoneSpaceSwitcher } from "../shared/ZoneSpaceSwitcher";
import { priorityBadge } from "../../lib/build-recommendations";
import { dedupePlantsByName } from "@lib/plant-dedupe";
import { plantIdsPlacedInZone } from "../../lib/zone-plant-groups";

export function BuildForMeResults() {
  const profile = useDesignerStore((s) => s.gardenProfile);
  const lastGenerateResult = useDesignerStore((s) => s.lastGenerateResult);
  const gardenStyle = lastGenerateResult?.preferences.gardenStyle;
  const isFoodForestPlan = gardenStyle === "food_forest";
  const recommendedPlantIds = useDesignerStore((s) => s.recommendedPlantIds);
  const recommendationMeta = useDesignerStore((s) => s.recommendationMeta);
  const pendingGardenPlan = useDesignerStore((s) => s.pendingGardenPlan);
  const zoneGardenPlans = useDesignerStore((s) => s.zoneGardenPlans);
  const spaceListZoneId = useDesignerStore((s) => s.spaceListZoneId);
  const showPendingGardenPlan = useDesignerStore((s) => s.showPendingGardenPlan);
  const zones = useDesignerStore((s) => s.zones);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectSidebarPlant = useDesignerStore((s) => s.selectSidebarPlant);
  const setPlanSheetOpen = useDesignerStore((s) => s.setPlanSheetOpen);
  const placeRecommendedOnCanvas = useDesignerStore(
    (s) => s.placeRecommendedOnCanvas,
  );
  const placingGardenOnCanvas = useDesignerStore((s) => s.placingGardenOnCanvas);
  const gardenPlanPlacedOnCanvas = useDesignerStore(
    (s) => s.gardenPlanPlacedOnCanvas,
  );
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);

  const recQuery = useRecommendedPlants(recommendedPlantIds);
  const recPlants = useMemo(
    () => dedupePlantsByName(recQuery.data ?? []),
    [recQuery.data],
  );
  const isLoading = recQuery.isLoading;

  const { plants, placedInZone, suggestedForZone } = useMemo(() => {
    if (zones.length < 2 || spaceListZoneId === "all") {
      return {
        plants: recPlants,
        placedInZone: [] as typeof recPlants,
        suggestedForZone: [] as typeof recPlants,
      };
    }
    const zone = zones.find((z) => z.id === spaceListZoneId);
    if (!zone) {
      return {
        plants: recPlants,
        placedInZone: [],
        suggestedForZone: [],
      };
    }
    const placedIds = plantIdsPlacedInZone(canvasPlants, zone, zones);
    const placed = recPlants.filter((p) => placedIds.has(p.id));
    const suggested = recPlants.filter((p) => !placedIds.has(p.id));
    return {
      plants: [...placed, ...suggested],
      placedInZone: placed,
      suggestedForZone: suggested,
    };
  }, [recPlants, zones, spaceListZoneId, canvasPlants]);

  const showZoneSections =
    zones.length >= 2 && spaceListZoneId !== "all" && !isLoading;

  const hasOtherBeds = zones.length > 0 || canvasPlants.length > 0;
  const zoneHasNoPlan =
    spaceListZoneId !== "all" && !zoneGardenPlans[spaceListZoneId];

  if (!profile) {
    return (
      <div className="sidebar-build-results sidebar-build-results--empty">
        <p className="sidebar-build-hint">
          {spaceListZoneId !== "all" && zoneHasNoPlan
            ? "This bed does not have a saved plan yet."
            : "No plan loaded."}
        </p>
        {pendingGardenPlan && zoneHasNoPlan && (
          <button
            type="button"
            className="sidebar-zone-draft-btn"
            onClick={() => showPendingGardenPlan()}
          >
            View latest draft ({pendingGardenPlan.profile.name})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sidebar-build-results">
      <RecommendationHeader />

      {zones.length >= 2 && (
        <ZoneSpaceSwitcher className="zone-space-switcher--sidebar" />
      )}

      <div className="sidebar-build-results-list">
        {isLoading && (
          <p className="designer-plant-list-status">Loading plants…</p>
        )}
        {!isLoading && plants.length === 0 && (
          <p className="designer-plant-list-status">No recommended plants.</p>
        )}
        {showZoneSections && placedInZone.length > 0 && (
          <p className="sidebar-zone-section-label">
            In this space ({placedInZone.length})
          </p>
        )}
        {plants.map((plant, index) => {
          const meta = recommendationMeta[plant.id];
          const showSuggestedHeader =
            showZoneSections &&
            suggestedForZone.length > 0 &&
            index === placedInZone.length;
          return (
            <div key={plant.id}>
              {showSuggestedHeader && (
                <p className="sidebar-zone-section-label">
                  Suggested for this space ({suggestedForZone.length})
                </p>
              )}
              <PlantCardDraggable
                plant={plant}
                selected={selectedPlantId === plant.id}
                onSelect={() => selectSidebarPlant(plant.id)}
                recommendation={
                  meta
                    ? {
                        priorityLabel: priorityBadge(meta.priority),
                        why: meta.why,
                        placementNote: meta.placement_note,
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <footer className="sidebar-build-results-foot">
        {gardenPlanPlacedOnCanvas ? (
          <>
            <p className="sidebar-build-results-placed">
              On your canvas — add companions and fill-in plants from Browse
              Plants.
            </p>
            <button
              type="button"
              className="rr-btn rr-btn-primary sidebar-build-results-place"
              onClick={() => focusDesignerCanvas()}
            >
              View on canvas
            </button>
            <button
              type="button"
              className="rr-btn rr-btn-secondary sidebar-build-results-secondary"
              onClick={() => setPlanSheetOpen(true)}
            >
              View full plan
            </button>
            <button
              type="button"
              className="sidebar-build-results-link"
              onClick={() => setSidebarMode("browse")}
            >
              Browse more plants →
            </button>
          </>
        ) : (
          <>
            {(hasOtherBeds || gardenStyle) && (
              <p className="sidebar-build-results-place-hint">
                {isFoodForestPlan
                  ? "Food forest: only fruit trees go on the canvas now — add shrubs and herbs from Browse Plants."
                  : gardenStyle === "kitchen_garden"
                    ? "Kitchen garden: herbs, veggies, and cooking crops — no fruit trees on the canvas."
                    : gardenStyle === "pollinator"
                      ? "Pollinator garden: flowers and nectar plants for bees and butterflies."
                      : gardenStyle === "visual"
                        ? "Visual garden: ornamental plants only — no fruit trees."
                        : hasOtherBeds
                          ? "Adds a new bed beside your layout — existing beds stay unchanged."
                          : null}
              </p>
            )}
            <button
              type="button"
              className="rr-btn rr-btn-primary sidebar-build-results-place"
              disabled={placingGardenOnCanvas}
              onClick={() => void placeRecommendedOnCanvas()}
            >
              {placingGardenOnCanvas
                ? "Placing on canvas…"
                : isFoodForestPlan
                  ? "Place trees on canvas"
                  : "Add plants to canvas"}
            </button>
            <button
              type="button"
              className="rr-btn rr-btn-secondary sidebar-build-results-secondary"
              onClick={() => setPlanSheetOpen(true)}
            >
              View full plan
            </button>
            <button
              type="button"
              className="sidebar-build-results-link"
              onClick={() => setSidebarMode("browse")}
            >
              Browse all plants separately →
            </button>
          </>
        )}
        {!isLoading && plants.length > 0 && (
          <p className="designer-sidebar-count">
            {zones.length >= 2 && spaceListZoneId !== "all"
              ? `${plants.length} in view · ${recPlants.length} total`
              : `${recPlants.length} recommended`}
          </p>
        )}
        <EvergreenInstallCta compact />
      </footer>
    </div>
  );
}
