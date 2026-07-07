import { useMemo, useState } from "react";
import { EvergreenInstallCta } from "../../../components/EvergreenInstallCta";
import { focusDesignerCanvas } from "../../lib/focus-designer-canvas";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useRecommendedPlants } from "../../hooks/useRecommendedPlants";
import { PlantCardDraggable } from "./PlantCardDraggable";
import { priorityBadge } from "../../lib/build-recommendations";
import { dedupePlantsByName } from "@lib/plant-dedupe";

export function EnhanceGuildResults() {
  const profile = useDesignerStore((s) => s.gardenProfile);
  const recommendedPlantIds = useDesignerStore((s) => s.recommendedPlantIds);
  const recommendationMeta = useDesignerStore((s) => s.recommendationMeta);
  const pendingEnhancePlan = useDesignerStore((s) => s.pendingEnhancePlan);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectSidebarPlant = useDesignerStore((s) => s.selectSidebarPlant);
  const placeEnhanceOnCanvas = useDesignerStore((s) => s.placeEnhanceOnCanvas);
  const placingEnhanceOnCanvas = useDesignerStore((s) => s.placingEnhanceOnCanvas);
  const enhancePlacedOnCanvas = useDesignerStore((s) => s.enhancePlacedOnCanvas);
  const setSidebarMode = useDesignerStore((s) => s.setSidebarMode);
  const resetEnhanceGuild = useDesignerStore((s) => s.resetEnhanceGuild);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const recQuery = useRecommendedPlants(recommendedPlantIds);
  const recPlants = useMemo(
    () => dedupePlantsByName(recQuery.data ?? []),
    [recQuery.data],
  );

  if (!profile || !pendingEnhancePlan) {
    return (
      <div className="sidebar-build-results sidebar-build-results--empty">
        <p className="sidebar-build-hint">No enhance plan loaded.</p>
      </div>
    );
  }

  async function onPlace() {
    setPlaceError(null);
    focusDesignerCanvas();
    try {
      await placeEnhanceOnCanvas();
    } catch (e) {
      setPlaceError(
        e instanceof Error ? e.message : "Could not place plants on canvas.",
      );
    }
  }

  return (
    <div className="sidebar-build-results">
      <div className="recommendation-header">
        <p className="recommendation-header-kicker">Guild completion</p>
        <h2 className="recommendation-header-title">{profile.name}</h2>
        <p className="sidebar-build-hint">{profile.description}</p>
        <div className="recommendation-header-actions">
          <button
            type="button"
            className="recommendation-header-btn"
            onClick={() => resetEnhanceGuild()}
          >
            Start over
          </button>
        </div>
      </div>

      {pendingEnhancePlan.existingTreeCount > 0 && (
        <p className="sidebar-build-hint">
          Keeping your {pendingEnhancePlan.existingTreeCount} fruit tree
          {pendingEnhancePlan.existingTreeCount === 1 ? "" : "s"} in place —
          adding understory layers around them.
        </p>
      )}

      <div className="sidebar-build-results-list">
        {recQuery.isLoading && (
          <p className="designer-plant-list-status">Loading plants…</p>
        )}
        {!recQuery.isLoading &&
          recPlants.map((plant) => {
            const meta = recommendationMeta[plant.id];
            return (
              <PlantCardDraggable
                key={plant.id}
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
            );
          })}
      </div>

      <footer className="sidebar-build-results-foot">
        {placeError && (
          <p className="sidebar-build-error" role="alert">
            {placeError}
          </p>
        )}
        {enhancePlacedOnCanvas ? (
          <p className="sidebar-build-results-placed">
            Understory plants added — your trees stayed put.
          </p>
        ) : (
          <>
            <p className="sidebar-build-results-place-hint">
              Places shrubs, herbs, and groundcovers in open space around your
              existing trees.
            </p>
            <button
              type="button"
              className="sidebar-build-continue sidebar-build-results-place"
              disabled={placingEnhanceOnCanvas || recQuery.isLoading}
              onClick={() => void onPlace()}
            >
              {placingEnhanceOnCanvas ? "Placing…" : "Add to canvas"}
            </button>
          </>
        )}
        <button
          type="button"
          className="sidebar-build-results-link"
          onClick={() => setSidebarMode("browse")}
        >
          Browse plants manually
        </button>
        <EvergreenInstallCta compact />
      </footer>
    </div>
  );
}
