import { useDesignerStore } from "../../store/useDesignerStore";
import { usePlantDetail } from "../../hooks/useTreflePlant";

export function PlantDetailPanel() {
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const closeDetailPanel = useDesignerStore((s) => s.closeDetailPanel);
  const addPlant = useDesignerStore((s) => s.addPlant);
  const deleteSelectedCanvasPlant = useDesignerStore(
    (s) => s.deleteSelectedCanvasPlant,
  );

  const canvasPlant = canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId);
  const plantId = selectedPlantId ?? canvasPlant?.plantId ?? null;
  const isOnCanvas = Boolean(
    canvasPlant && selectedCanvasPlantId === canvasPlant.canvasId,
  );

  const { data: plant, isLoading } = usePlantDetail(plantId);

  const open = Boolean(plantId);

  if (!open) return null;

  return (
    <aside className={`designer-detail${open ? " open" : ""}`}>
      <div className="designer-detail-inner">
        <div className="designer-detail-actions">
          <button
            type="button"
            className="rr-btn rr-btn-secondary"
            onClick={() => closeDetailPanel()}
          >
            Close
          </button>
          {isOnCanvas && (
            <button
              type="button"
              className="designer-btn-delete"
              onClick={() => deleteSelectedCanvasPlant()}
            >
              Remove from layout
            </button>
          )}
        </div>

        {isLoading && <p className="designer-section-label">Loading plant…</p>}

        {plant && (
          <>
            {plant.image_url ? (
              <img
                src={plant.image_url}
                alt={plant.common_name}
                className="designer-detail-img"
              />
            ) : (
              <div
                className="designer-detail-img"
                style={{
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                No image
              </div>
            )}
            {plant.data_source === "trefle" && (
              <span className="designer-badge designer-badge-trefle">📷 Trefle</span>
            )}
            <h2>{plant.common_name}</h2>
            <p className="sci">{plant.scientific_name}</p>
            <div className="designer-badges" style={{ marginBottom: "0.75rem" }}>
              <span className="designer-badge">{plant.category}</span>
              <span className="designer-badge">{plant.canopy_layer}</span>
              {plant.is_florida_native && (
                <span className="designer-badge designer-badge-native">
                  🌿 Florida native
                </span>
              )}
              {plant.is_invasive_in_florida && (
                <span className="designer-badge designer-badge-warn">
                  ⚠️ Invasive in FL
                </span>
              )}
            </div>
            {(plant.florida_hardiness_zones?.length ?? plant.growing_zones?.length) ? (
              <div className="designer-badges">
                {(plant.florida_hardiness_zones ?? plant.growing_zones ?? [])
                  .slice(0, 6)
                  .map((z) => (
                    <span key={z} className="designer-badge">
                      {z}
                    </span>
                  ))}
              </div>
            ) : null}
            <div className="designer-stats">
              <div className="designer-stat">
                <strong>Sunlight</strong>
                {plant.sunlight}
              </div>
              <div className="designer-stat">
                <strong>Water</strong>
                {plant.water_needs}
              </div>
              <div className="designer-stat">
                <strong>Mature size</strong>
                {plant.mature_height_feet[0]}–{plant.mature_height_feet[1]} ft
              </div>
              <div className="designer-stat">
                <strong>Growth</strong>
                {plant.growth_rate}
              </div>
            </div>
            {plant.care_summary && (
              <section>
                <h4>Care guide</h4>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{plant.care_summary}</p>
              </section>
            )}
            {plant.uses?.length > 0 && (
              <section>
                <h4>Uses</h4>
                <p style={{ fontSize: "0.88rem" }}>{plant.uses.join(" · ")}</p>
              </section>
            )}
            {plant.benefits?.length > 0 && (
              <section>
                <h4>Benefits</h4>
                <p style={{ fontSize: "0.88rem" }}>{plant.benefits.join(" · ")}</p>
              </section>
            )}
            {plant.guild_functions?.length > 0 && (
              <section>
                <h4>Guild functions</h4>
                <div className="designer-badges">
                  {plant.guild_functions.map((g) => (
                    <span key={g} className="designer-badge">
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {plant.data_source === "trefle" && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Data sourced from Trefle.io — community-verified plant database
              </p>
            )}
            <div className="designer-detail-footer">
              {isOnCanvas ? (
                <button
                  type="button"
                  className="designer-btn-delete designer-btn-delete--block"
                  onClick={() => deleteSelectedCanvasPlant()}
                >
                  Remove from layout
                </button>
              ) : (
                <button
                  type="button"
                  className="rr-btn rr-btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => addPlant(plant, 280, 220)}
                >
                  + Add to canvas
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
