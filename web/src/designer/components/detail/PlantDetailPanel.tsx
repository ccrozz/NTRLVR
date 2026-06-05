import { useMemo } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import { usePlantDetail } from "../../hooks/useTreflePlant";
import { useCompanionPlants } from "../../hooks/useCompanionPlants";
import { canopyColor } from "../../lib/canopy-colors";
import {
  hasExtraDetail,
  isPlantDetailSparse,
  resolveCompanionPlant,
} from "../../lib/plant-detail-helpers";
import { useCompanionReasonsBatch } from "../../hooks/useCompanionReasonsBatch";
import { isCompanionPlacedNearHost } from "../../lib/companion-placement";
import { CompanionSuggestionRow } from "./CompanionSuggestionRow";
import { DesignerPlantGuide } from "./DesignerPlantGuide";
import { PlantCatalogProfile } from "./PlantCatalogProfile";

const MAX_COMPANIONS = 6;

export function PlantDetailPanel() {
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const designerState = useDesignerStore((s) => s.designerState);
  const closeDetailPanel = useDesignerStore((s) => s.closeDetailPanel);
  const setSearchQuery = useDesignerStore((s) => s.setSearchQuery);
  const deleteSelectedCanvasPlant = useDesignerStore(
    (s) => s.deleteSelectedCanvasPlant,
  );

  const canvasPlant = canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId);
  const plantId = selectedPlantId;
  /** Canvas selection wins only when viewing that same plant (sidebar click keeps catalog profile). */
  const isOnCanvas = Boolean(
    canvasPlant &&
      selectedCanvasPlantId === canvasPlant.canvasId &&
      selectedPlantId === canvasPlant.plantId,
  );
  const catalogOnly = Boolean(selectedPlantId && !isOnCanvas);

  const { data: plant, isLoading } = usePlantDetail(plantId);
  const open = Boolean(selectedPlantId);

  const companionNames = plant?.companion_plants ?? [];
  const { data: resolvedCompanions = [] } = useCompanionPlants(
    companionNames,
    open,
  );

  const companionRows = useMemo(() => {
    if (!plant) return [];
    const names = companionNames.slice(0, MAX_COMPANIONS);
    const rows = names.map((name) => {
      const match = resolveCompanionPlant(name, resolvedCompanions);
      const full = match
        ? resolvedCompanions.find((p) => p.id === match.id) ?? null
        : null;
      return { name, plant: full };
    });
    const withPlant = rows.filter((r) => r.plant);
    const totalSlots = withPlant.length;
    return rows.map((row) => ({
      ...row,
      slotIndex: row.plant
        ? withPlant.findIndex((r) => r.name === row.name)
        : -1,
      totalSlots,
    }));
  }, [companionNames, resolvedCompanions, plant]);

  const companionIds = useMemo(
    () =>
      companionRows
        .map((r) => r.plant?.id)
        .filter((id): id is string => Boolean(id)),
    [companionRows],
  );

  const catalogCompanionIds = useMemo(() => {
    if (!plant || !catalogOnly) return [];
    return companionNames
      .map((name) => resolveCompanionPlant(name, resolvedCompanions)?.id)
      .filter((id): id is string => Boolean(id));
  }, [catalogOnly, companionNames, resolvedCompanions, plant]);

  const reasonHostId = plantId;
  const reasonCompanionIds = isOnCanvas ? companionIds : catalogCompanionIds;

  const { data: companionReasons = {}, isLoading: reasonsLoading } =
    useCompanionReasonsBatch(
      reasonHostId,
      reasonCompanionIds,
      open && reasonCompanionIds.length > 0,
    );

  if (!open) return null;

  const layerColors = plant ? canopyColor(plant.canopy_layer) : null;
  const sparse = plant ? isPlantDetailSparse(plant) : false;
  const showMore = plant && hasExtraDetail(plant);

  return (
    <aside className={`designer-detail${open ? " open" : ""}`} aria-label="Plant details">
      <div className="designer-detail-inner">
        {isLoading && (
          <p className="designer-detail-muted" style={{ paddingTop: "1rem" }}>
            Loading…
          </p>
        )}

        {plant && (
          <>
            <header
              className={`designer-detail-head${catalogOnly ? " designer-detail-head--catalog" : ""}`}
            >
              {plant.image_url ? (
                <img src={plant.image_url} alt="" className="designer-detail-thumb" />
              ) : (
                <span className="designer-detail-thumb designer-detail-thumb--empty">
                  {plant.common_name.charAt(0)}
                </span>
              )}
              <div className="designer-detail-head-text">
                <h2>{plant.common_name}</h2>
                <p className="designer-detail-meta">
                  <em>{plant.scientific_name}</em>
                  <span aria-hidden> · </span>
                  <span
                    style={
                      layerColors ? { color: layerColors.stroke } : undefined
                    }
                  >
                    {plant.canopy_layer}
                  </span>
                  <span aria-hidden> · </span>
                  {plant.category}
                </p>
                <p className="designer-detail-badges">
                  {plant.is_edible && <span className="designer-detail-badge">Edible</span>}
                  {plant.is_kitchen_essential && (
                    <span className="designer-detail-badge">Kitchen staple</span>
                  )}
                  {plant.native_origin?.trim() ? (
                    <span className="designer-detail-badge designer-detail-badge--origin">
                      {plant.native_origin.trim()}
                    </span>
                  ) : plant.is_florida_native ? (
                    <span className="designer-detail-badge">Florida native</span>
                  ) : null}
                  {plant.is_invasive_in_florida && (
                    <span className="designer-detail-badge designer-detail-badge--warn">
                      Invasive
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="designer-detail-close"
                aria-label="Close"
                onClick={() => closeDetailPanel()}
              >
                ×
              </button>
            </header>

            <DesignerPlantGuide plant={plant} stateCode={designerState} />

            {sparse && (
              <p className="designer-detail-sparse">
                Guild notes for this plant are still being expanded.
              </p>
            )}

            {catalogOnly && (
              <PlantCatalogProfile
                plant={plant}
                companionNames={companionNames}
                resolvedCompanions={resolvedCompanions}
                companionReasons={companionReasons}
                reasonsLoading={reasonsLoading}
                onFindCompanion={setSearchQuery}
              />
            )}

            {isOnCanvas && companionNames.length > 0 && (
              <section className="designer-detail-block">
                <h3 className="designer-detail-block-title">Plant nearby</h3>
                <p className="designer-detail-hint">
                  Tap + to place on the recommended ring, or drag onto the grid. Why?
                  for the pairing note.
                </p>
                <div className="designer-detail-companion-rows">
                  {companionRows.map(({ name, plant: cp, slotIndex, totalSlots }) =>
                    cp && canvasPlant && slotIndex >= 0 ? (
                      <CompanionSuggestionRow
                        key={`${cp.id}-${name}`}
                        companion={cp}
                        hostCanvasId={canvasPlant.canvasId}
                        slotIndex={slotIndex}
                        totalSlots={totalSlots}
                        alreadyPlaced={
                          canvasPlant
                            ? isCompanionPlacedNearHost(
                                canvasPlant,
                                cp.id,
                                canvasPlants,
                              )
                            : false
                        }
                        reason={companionReasons[cp.id] ?? ""}
                        reasonLoading={reasonsLoading && !companionReasons[cp.id]}
                      />
                    ) : (
                      <div
                        key={name}
                        className="designer-detail-companion-row designer-detail-companion-row--missing"
                      >
                        <span className="designer-detail-companion-name">{name}</span>
                        <button
                          type="button"
                          className="designer-detail-find-btn"
                          onClick={() => setSearchQuery(name)}
                        >
                          Find in plant list
                        </button>
                      </div>
                    ),
                  )}
                </div>
                {companionNames.length > MAX_COMPANIONS && (
                  <p className="designer-detail-muted">
                    +{companionNames.length - MAX_COMPANIONS} more companions in this
                    guild
                  </p>
                )}
              </section>
            )}

            {isOnCanvas && companionNames.length === 0 && (
              <p className="designer-detail-muted">
                No companion suggestions for this plant yet.
              </p>
            )}

            {showMore && !catalogOnly && (
              <section className="designer-detail-block designer-detail-more">
                <h3 className="designer-detail-block-title">More detail</h3>
                {plant.guild_functions?.length > 0 && (
                  <div>
                    <h4>Roles</h4>
                    <p>{plant.guild_functions.join(" · ")}</p>
                  </div>
                )}
                {plant.uses?.length > 0 && (
                  <div>
                    <h4>Uses</h4>
                    <p>{plant.uses.join(" · ")}</p>
                  </div>
                )}
                {plant.benefits?.length > 0 && (
                  <div>
                    <h4>Benefits</h4>
                    <ul>
                      {plant.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {isOnCanvas && (
              <footer className="designer-detail-footer">
                <button
                  type="button"
                  className="designer-detail-remove"
                  onClick={() => deleteSelectedCanvasPlant()}
                >
                  Remove from layout
                </button>
              </footer>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
