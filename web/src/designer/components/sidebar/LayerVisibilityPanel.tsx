import type { CanopyLayer } from "../../../types";
import { CANOPY_COLORS } from "../../lib/canopy-colors";
import { useDesignerStore } from "../../store/useDesignerStore";

const LAYERS: CanopyLayer[] = [
  "Overstory",
  "Understory",
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Root",
  "Vine",
];

export function LayerVisibilityPanel() {
  const hiddenLayers = useDesignerStore((s) => s.hiddenLayers);
  const toggleLayerVisibility = useDesignerStore((s) => s.toggleLayerVisibility);
  const hiddenCount = hiddenLayers.length;

  return (
    <details className="designer-sidebar-layers">
      <summary>
        Canvas layers
        {hiddenCount > 0 && (
          <span className="designer-sidebar-layers-count">{hiddenCount} hidden</span>
        )}
      </summary>
      <ul className="designer-layer-list">
        {LAYERS.map((layer) => {
          const visible = !hiddenLayers.includes(layer);
          const swatch = CANOPY_COLORS[layer];
          return (
            <li key={layer}>
              <button
                type="button"
                className={`designer-layer-toggle${visible ? "" : " is-hidden"}`}
                onClick={() => toggleLayerVisibility(layer)}
              >
                <span
                  className="designer-layer-swatch"
                  style={{ background: swatch.stroke }}
                />
                <span className="designer-layer-name">{swatch.label}</span>
                <span className="designer-layer-state">{visible ? "On" : "Off"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
