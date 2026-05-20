import { useEffect, useMemo, useRef, useState } from "react";
import { canopyColor } from "../../lib/canopy-colors";
import {
  centeredPanelPosition,
  useFloatingPanelPosition,
} from "../../hooks/useFloatingPanelPosition";
import { plantInsideZones } from "../../lib/zone-geometry";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { CanvasPlant } from "../../types";

const PANEL_POS_KEY = "ntr-garden-panel-pos";
const DEFAULT_PANEL_POS = { x: 0, y: 0 };

function sortGardenPlants(plants: CanvasPlant[]): CanvasPlant[] {
  return [...plants].sort((a, b) =>
    a.common_name.localeCompare(b.common_name, undefined, {
      sensitivity: "base",
    }),
  );
}

function GardenPlantRow({
  plant,
  selected,
  outsideZone,
  onSelect,
}: {
  plant: CanvasPlant;
  selected: boolean;
  outsideZone: boolean;
  onSelect: () => void;
}) {
  const layer = canopyColor(plant.canopy_layer);
  const initial = plant.common_name.trim().charAt(0).toUpperCase() || "?";
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(plant.image_url) && !imgFailed;

  return (
    <li>
      <button
        type="button"
        className={`garden-panel-item${selected ? " active" : ""}${outsideZone ? " garden-panel-item--outside" : ""}`}
        onClick={onSelect}
      >
        <span className="garden-panel-thumb" aria-hidden>
          {showPhoto ? (
            <img
              src={plant.image_url!}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className="garden-panel-thumb--empty"
              style={{ color: layer.stroke }}
            >
              {initial}
            </span>
          )}
        </span>
        <span className="garden-panel-meta">
          <strong>{plant.common_name}</strong>
          <span>
            {plant.canopy_layer}
            {outsideZone ? " · Outside space" : ""}
          </span>
        </span>
      </button>
    </li>
  );
}

export function GardenPanel() {
  const open = useDesignerStore((s) => s.gardenPanelOpen);
  const setOpen = useDesignerStore((s) => s.setGardenPanelOpen);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const selectCanvasPlant = useDesignerStore((s) => s.selectCanvasPlant);
  const selectSidebarPlant = useDesignerStore((s) => s.selectSidebarPlant);

  const boundsRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const { panelRef, position, setPosition, dragHandleProps } =
    useFloatingPanelPosition(PANEL_POS_KEY, DEFAULT_PANEL_POS, boundsRef);

  const count = canvasPlants.length;
  const sorted = useMemo(() => sortGardenPlants(canvasPlants), [canvasPlants]);
  const hasZones = zones.length > 0;

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    const applyCenter = () => {
      const centered = centeredPanelPosition(
        boundsRef.current,
        panelRef.current,
      );
      if (centered) setPosition(centered);
      return centered != null;
    };

    if (!applyCenter()) {
      requestAnimationFrame(() => {
        applyCenter();
      });
    }
  }, [open, panelRef, setPosition]);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        className={`designer-garden-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="designer-garden-panel"
        onClick={() => setOpen(!open)}
        title={open ? "Hide your garden list" : "Browse plants on your canvas"}
      >
        <span className="designer-garden-trigger-label">Your garden</span>
        <span className="designer-garden-trigger-count">{count}</span>
      </button>

      <div
        ref={boundsRef}
        className="garden-panel-bounds"
        aria-hidden={!open}
      >
        {open && (
          <aside
            id="designer-garden-panel"
            ref={panelRef}
            className="garden-panel garden-panel--floating"
            style={{ left: position.x, top: position.y }}
            aria-label="Your garden"
          >
            <header
              className="garden-panel-header garden-panel-drag-handle"
              {...dragHandleProps}
              title="Drag to move"
            >
              <div className="garden-panel-title-wrap">
                <span className="garden-panel-drag-icon" aria-hidden>
                  ⠿
                </span>
                <h2>Your garden</h2>
                <span className="garden-panel-count">{count}</span>
              </div>
              <button
                type="button"
                className="garden-panel-close"
                onClick={() => setOpen(false)}
                aria-label="Close garden list"
              >
                ×
              </button>
            </header>

            <p className="garden-panel-hint">
              Tap a plant to select it on the canvas and view details.
            </p>

            <ul className="garden-panel-scroll">
              {sorted.map((cp) => (
                <GardenPlantRow
                  key={cp.canvasId}
                  plant={cp}
                  selected={selectedCanvasPlantId === cp.canvasId}
                  outsideZone={
                    hasZones && !plantInsideZones(cp.x, cp.y, zones)
                  }
                  onSelect={() => {
                    selectCanvasPlant(cp.canvasId);
                    selectSidebarPlant(cp.plantId);
                  }}
                />
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}
