import { useDesignerStore } from "../../store/useDesignerStore";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";

export function SelectionActionBar() {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const openCanvasPlantProfile = useDesignerStore((s) => s.openCanvasPlantProfile);
  const deleteSelectedCanvasPlant = useDesignerStore(
    (s) => s.deleteSelectedCanvasPlant,
  );

  const plant = canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId);
  if (!plant) return null;

  const profileOpen =
    Boolean(selectedPlantId) && selectedPlantId === plant.plantId;

  return (
    <div
      className="designer-selection-bar"
      role="toolbar"
      aria-label="Selected plant"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`designer-selection-bar-profile${profileOpen ? " is-open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          openCanvasPlantProfile(plant.canvasId);
        }}
        aria-label={
          profileOpen
            ? `${plant.common_name} profile is open`
            : `View profile for ${plant.common_name}`
        }
        aria-expanded={profileOpen}
      >
        <span className="designer-selection-bar-label">{plant.common_name}</span>
        <span className="designer-selection-bar-hint">
          {profileOpen
            ? "Profile open"
            : isMobile
              ? "Tap for profile"
              : "View profile"}
        </span>
      </button>
      <button
        type="button"
        className="designer-btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          deleteSelectedCanvasPlant();
        }}
        aria-label={`Remove ${plant.common_name} from layout`}
      >
        Delete
      </button>
    </div>
  );
}
