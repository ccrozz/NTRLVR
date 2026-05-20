import { useEffect, useMemo, useRef, useState } from "react";
import { canopyColor } from "../../lib/canopy-colors";
import {
  GARDEN_CATEGORY_ACCENT,
  groupGardenPlantsByCategory,
} from "../../lib/garden-plant-groups";
import {
  topCenterPanelPosition,
  useFloatingPanelPosition,
} from "../../hooks/useFloatingPanelPosition";
import { canvasPlantsInZone } from "../../lib/zone-plant-groups";
import { plantOutsideOwnedZone } from "../../lib/zone-geometry";
import { ZoneSpaceSwitcher } from "../shared/ZoneSpaceSwitcher";
import { ZoneRenameField } from "../shared/ZoneRenameField";
import { zoneColor } from "../workspace/WorkspacePanel";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { CanvasPlant } from "../../types";
import type { GardenCategoryGroup } from "../../lib/garden-plant-groups";

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
  const accent =
    GARDEN_CATEGORY_ACCENT[plant.category] ?? layer.stroke;
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
        <span
          className="garden-panel-item-accent"
          style={{ background: accent }}
          aria-hidden
        />
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

function GardenCategorySection({
  group,
  selectedCanvasPlantId,
  hasZones,
  zones,
  onSelectPlant,
}: {
  group: GardenCategoryGroup;
  selectedCanvasPlantId: string | null;
  hasZones: boolean;
  zones: ReturnType<typeof useDesignerStore.getState>["zones"];
  onSelectPlant: (cp: CanvasPlant) => void;
}) {
  const accent =
    GARDEN_CATEGORY_ACCENT[group.category] ?? "var(--color-accent)";

  return (
    <section className="garden-panel-category">
      <header className="garden-panel-category-head">
        <span
          className="garden-panel-category-chip"
          style={{ background: accent }}
          aria-hidden
        />
        <h3>{group.category}</h3>
        <span className="garden-panel-category-count">{group.plants.length}</span>
      </header>
      <ul className="garden-panel-category-list">
        {group.plants.map((cp) => (
          <GardenPlantRow
            key={cp.canvasId}
            plant={cp}
            selected={selectedCanvasPlantId === cp.canvasId}
            outsideZone={hasZones && plantOutsideOwnedZone(cp, zones)}
            onSelect={() => onSelectPlant(cp)}
          />
        ))}
      </ul>
    </section>
  );
}

export function GardenPanel() {
  const open = useDesignerStore((s) => s.gardenPanelOpen);
  const setOpen = useDesignerStore((s) => s.setGardenPanelOpen);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const zones = useDesignerStore((s) => s.zones);
  const spaceListZoneId = useDesignerStore((s) => s.spaceListZoneId);
  const zoneGardenPlans = useDesignerStore((s) => s.zoneGardenPlans);
  const selectedCanvasPlantId = useDesignerStore((s) => s.selectedCanvasPlantId);
  const selectCanvasPlant = useDesignerStore((s) => s.selectCanvasPlant);
  const selectSidebarPlant = useDesignerStore((s) => s.selectSidebarPlant);
  const removeZone = useDesignerStore((s) => s.removeZone);

  const boundsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { panelRef, position, setPosition, dragHandleProps } =
    useFloatingPanelPosition(PANEL_POS_KEY, DEFAULT_PANEL_POS, boundsRef);

  const count = canvasPlants.length;
  const gardenVision = useDesignerStore((s) => s.gardenVision);

  const focusedZoneId =
    spaceListZoneId !== "all"
      ? spaceListZoneId
      : zones.length === 1
        ? zones[0]?.id
        : null;

  const focusedZone = focusedZoneId
    ? zones.find((z) => z.id === focusedZoneId)
    : undefined;

  const focusedZoneIndex = focusedZone
    ? zones.findIndex((z) => z.id === focusedZone.id)
    : -1;

  const savedPlan = focusedZoneId
    ? zoneGardenPlans[focusedZoneId]
    : undefined;

  const sorted = useMemo(() => {
    const base = sortGardenPlants(canvasPlants);
    if (!focusedZone) return base;
    return sortGardenPlants(canvasPlantsInZone(base, focusedZone, zones));
  }, [canvasPlants, zones, focusedZone]);

  const showCategoryGroups = Boolean(focusedZone && sorted.length > 0);
  const categoryGroups = useMemo(
    () => (showCategoryGroups ? groupGardenPlantsByCategory(sorted) : []),
    [showCategoryGroups, sorted],
  );

  const hasZones = zones.length > 0;
  const listCount = sorted.length;
  const canManageSpace = Boolean(focusedZone);

  useEffect(() => {
    setConfirmDelete(false);
  }, [focusedZoneId]);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    const applyTopCenter = () => {
      const trigger = triggerRef.current;
      const panelTop = trigger
        ? trigger.offsetTop + trigger.offsetHeight + 14
        : 92;
      const anchored = topCenterPanelPosition(
        boundsRef.current,
        panelRef.current,
        { top: panelTop },
      );
      if (anchored) setPosition(anchored);
      return anchored != null;
    };

    if (!applyTopCenter()) {
      requestAnimationFrame(() => {
        applyTopCenter();
      });
    }
  }, [open, panelRef, setPosition]);

  function onSelectPlant(cp: CanvasPlant) {
    selectCanvasPlant(cp.canvasId);
    selectSidebarPlant(cp.plantId);
  }

  function confirmRemoveSpace() {
    if (!focusedZone) return;
    removeZone(focusedZone.id);
    setConfirmDelete(false);
  }

  if (count === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`designer-canvas-dock-pill designer-garden-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="designer-garden-panel"
        onClick={() => setOpen(!open)}
        title={open ? "Hide your garden list" : "Browse plants on your canvas"}
      >
        <span className="designer-canvas-dock-icon designer-garden-trigger-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M12 3c-4 0-7 2.5-7 6.5C5 14 12 21 12 21s7-7 7-11.5C19 5.5 16 3 12 3z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="9.5" r="2" fill="currentColor" opacity="0.85" />
          </svg>
        </span>
        <span className="designer-canvas-dock-text designer-garden-trigger-text">
          <span className="designer-canvas-dock-label designer-garden-trigger-label">Your garden</span>
          <span className="designer-canvas-dock-sub designer-garden-trigger-sub">
            {count} {count === 1 ? "plant" : "plants"} on canvas
          </span>
        </span>
        <span className="designer-garden-trigger-count" aria-hidden>
          {count}
        </span>
        <span className="designer-canvas-dock-chevron designer-garden-trigger-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
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
                <span className="garden-panel-header-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path
                      d="M12 3c-4 0-7 2.5-7 6.5C5 14 12 21 12 21s7-7 7-11.5C19 5.5 16 3 12 3z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <div className="garden-panel-title-block">
                  <h2>Your garden</h2>
                  <p className="garden-panel-title-meta">
                    {focusedZone
                      ? `${listCount} in this space · ${count} total`
                      : `${count} plants on your canvas`}
                  </p>
                </div>
                <span className="garden-panel-count">
                  {focusedZone ? listCount : count}
                </span>
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

            {gardenVision && spaceListZoneId === "all" && zones.length !== 1 && (
              <div className="garden-panel-vision">
                <h3>{gardenVision.name}</h3>
                <p>{gardenVision.description}</p>
              </div>
            )}

            <ZoneSpaceSwitcher
              className="zone-space-switcher--panel"
              hideRename
            />

            {canManageSpace && focusedZone && (
              <div
                className="garden-panel-space-card"
                style={
                  focusedZoneIndex >= 0
                    ? {
                        borderColor: `${zoneColor(focusedZoneIndex)}55`,
                      }
                    : undefined
                }
              >
                <div className="garden-panel-space-card-top">
                  {focusedZoneIndex >= 0 && (
                    <span
                      className="garden-panel-space-swatch"
                      style={{ background: zoneColor(focusedZoneIndex) }}
                      aria-hidden
                    />
                  )}
                  <div className="garden-panel-space-card-main">
                    <ZoneRenameField
                      zoneId={focusedZone.id}
                      className="garden-panel-rename"
                    />
                    {savedPlan?.profile.name && (
                      <p className="garden-panel-plan-name">
                        {savedPlan.profile.name}
                      </p>
                    )}
                  </div>
                </div>
                {confirmDelete ? (
                  <div className="garden-panel-delete-confirm" role="alert">
                    <p>
                      Remove <strong>{focusedZone.name}</strong> and all plants
                      inside it? This cannot be undone.
                    </p>
                    <div className="garden-panel-delete-actions">
                      <button
                        type="button"
                        className="garden-panel-delete-cancel"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="garden-panel-delete-confirm-btn"
                        onClick={confirmRemoveSpace}
                      >
                        Delete space
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="garden-panel-delete-space"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete this garden space
                  </button>
                )}
              </div>
            )}

            <p className="garden-panel-hint">
              {showCategoryGroups
                ? "Plants grouped by type in this space. Tap to select on the canvas."
                : "Tap a plant to select it on the canvas and view details."}
            </p>

            <div className="garden-panel-scroll">
              {showCategoryGroups ? (
                categoryGroups.map((group) => (
                  <GardenCategorySection
                    key={group.category}
                    group={group}
                    selectedCanvasPlantId={selectedCanvasPlantId}
                    hasZones={hasZones}
                    zones={zones}
                    onSelectPlant={onSelectPlant}
                  />
                ))
              ) : (
                <ul className="garden-panel-flat-list">
                  {sorted.map((cp) => (
                    <GardenPlantRow
                      key={cp.canvasId}
                      plant={cp}
                      selected={selectedCanvasPlantId === cp.canvasId}
                      outsideZone={
                        hasZones && plantOutsideOwnedZone(cp, zones)
                      }
                      onSelect={() => onSelectPlant(cp)}
                    />
                  ))}
                </ul>
              )}
              {listCount === 0 && focusedZone && (
                <p className="garden-panel-empty-space">
                  No plants in {focusedZone.name} yet. Place some from Browse or
                  Build for me.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
