import { useDesignerStore } from "../../store/useDesignerStore";

export function SelectionActionBar() {
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const deleteSelectedCanvasPlant = useDesignerStore(
    (s) => s.deleteSelectedCanvasPlant,
  );

  const plant = canvasPlants.find((p) => p.canvasId === selectedCanvasPlantId);
  if (!plant) return null;

  return (
    <div className="designer-selection-bar" role="toolbar" aria-label="Selected plant">
      <span className="designer-selection-bar-label">{plant.common_name}</span>
      <button
        type="button"
        className="designer-btn-delete"
        onClick={() => deleteSelectedCanvasPlant()}
        aria-label={`Remove ${plant.common_name} from layout`}
      >
        Delete
      </button>
    </div>
  );
}
