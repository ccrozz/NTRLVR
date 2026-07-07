import { zoneHasPlants } from "../../lib/zone-plant-groups";
import { useDesignerStore } from "../../store/useDesignerStore";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";

type SelectionActionBarProps = {
  plantDragActive?: boolean;
};

export function SelectionActionBar({
  plantDragActive = false,
}: SelectionActionBarProps) {
  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const selectedPlantId = useDesignerStore((s) => s.selectedPlantId);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const plantPickStack = useDesignerStore((s) => s.plantPickStack);
  const pickCanvasPlantAtPoint = useDesignerStore(
    (s) => s.pickCanvasPlantAtPoint,
  );
  const zones = useDesignerStore((s) => s.zones);
  const activeZoneId = useDesignerStore((s) => s.activeZoneId);
  const workspaceTool = useDesignerStore((s) => s.workspaceTool);
  const openCanvasPlantProfile = useDesignerStore((s) => s.openCanvasPlantProfile);
  const deleteSelectedCanvasPlant = useDesignerStore(
    (s) => s.deleteSelectedCanvasPlant,
  );
  const removeZone = useDesignerStore((s) => s.removeZone);

  const plant = canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId);
  const activeZone = activeZoneId
    ? zones.find((z) => z.id === activeZoneId)
    : undefined;

  const showZoneDelete =
    !plantDragActive &&
    !plant &&
    workspaceTool === "select" &&
    activeZone &&
    !zoneHasPlants(canvasPlants, activeZone, zones);

  if (showZoneDelete) {
    return (
      <div
        className="designer-selection-bar designer-selection-bar--zone"
        role="toolbar"
        aria-label="Empty bed"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="designer-zone-delete-bar-label">
          <strong>{activeZone.name}</strong> is empty
        </span>
        <button
          type="button"
          className="designer-btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            removeZone(activeZone.id);
          }}
        >
          Delete bed
        </button>
      </div>
    );
  }

  if (!plant) return null;

  const profileOpen =
    Boolean(selectedPlantId) && selectedPlantId === plant.plantId;

  const stackSize = plantPickStack?.ids.length ?? 0;
  const stackIndex =
    plantPickStack && selectedCanvasPlantId
      ? plantPickStack.ids.indexOf(selectedCanvasPlantId) + 1
      : 0;
  const showStackCycle = stackSize > 1 && stackIndex > 0;

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
      {showStackCycle && plantPickStack && (
        <button
          type="button"
          className="designer-selection-bar-cycle"
          onClick={(e) => {
            e.stopPropagation();
            pickCanvasPlantAtPoint(plantPickStack.x, plantPickStack.y);
          }}
          aria-label={`Cycle overlapping plants, ${stackIndex} of ${stackSize}`}
        >
          {stackIndex}/{stackSize}
        </button>
      )}
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
