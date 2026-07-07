import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { canopyColor } from "../../lib/canopy-colors";
import {
  GARDEN_CATEGORY_ACCENT,
  groupGardenPlantsByCategory,
} from "../../lib/garden-plant-groups";
import {
  topCenterPanelPosition,
  useFloatingPanelPosition,
} from "../../hooks/useFloatingPanelPosition";
import { useMatchMedia } from "../../hooks/useMatchMedia";
import { MOBILE_LAYOUT_QUERY } from "../../lib/mobile-layout";
import {
  canvasPlantsInZone,
  zoneHasPlants,
} from "../../lib/zone-plant-groups";
import { plantOutsideOwnedZone } from "../../lib/zone-geometry";
import { ZoneSpaceSwitcher } from "../shared/ZoneSpaceSwitcher";
import { ZoneRenameField } from "../shared/ZoneRenameField";
import { zoneColor } from "../workspace/WorkspacePanel";
import { EvergreenInstallCta } from "../../../components/EvergreenInstallCta";
import { useDesignerStore } from "../../store/useDesignerStore";
import { openEnhanceGuildSidebar } from "../../lib/open-enhance-sidebar";
import {
  countFruitTreesInZone,
  zoneNeedsGuildEnhance,
} from "../../lib/enhance-zone";
import type { CanvasPlant } from "../../types";
import type { GardenCategoryGroup } from "../../lib/garden-plant-groups";

const PANEL_POS_KEY = "ntr-garden-panel-pos";
const TRIGGER_POS_KEY = "ntr-garden-trigger-pos-mobile";
const DEFAULT_PANEL_POS = { x: 0, y: 0 };
const DEFAULT_TRIGGER_POS = { x: 0, y: 0 };

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
  onOpenProfile,
  onDelete,
}: {
  plant: CanvasPlant;
  selected: boolean;
  outsideZone: boolean;
  onSelect: () => void;
  onOpenProfile: () => void;
  onDelete: () => void;
}) {
  const layer = canopyColor(plant.canopy_layer);
  const accent =
    GARDEN_CATEGORY_ACCENT[plant.category] ?? layer.stroke;
  const initial = plant.common_name.trim().charAt(0).toUpperCase() || "?";
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(plant.image_url) && !imgFailed;

  return (
    <li className="garden-panel-row">
      <button
        type="button"
        className={`garden-panel-item${selected ? " active" : ""}${outsideZone ? " garden-panel-item--outside" : ""}`}
        onClick={onSelect}
        onDoubleClick={(e) => {
          e.preventDefault();
          onOpenProfile();
        }}
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
      <button
        type="button"
        className="garden-panel-item-profile"
        aria-label={`View profile for ${plant.common_name}`}
        title="Plant profile"
        onClick={(e) => {
          e.stopPropagation();
          onOpenProfile();
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
          <path
            d="M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="garden-panel-item-delete"
        aria-label={`Remove ${plant.common_name} from canvas`}
        title="Remove plant"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
          <path
            d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2 0v13.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5V6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 10v6M14 10v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}

function GardenCategorySection({
  group,
  collapsible,
  defaultOpen,
  selectedCanvasPlantId,
  hasZones,
  zones,
  onSelectPlant,
  onOpenPlantProfile,
  onDeletePlant,
}: {
  group: GardenCategoryGroup;
  collapsible: boolean;
  defaultOpen: boolean;
  selectedCanvasPlantId: string | null;
  hasZones: boolean;
  zones: ReturnType<typeof useDesignerStore.getState>["zones"];
  onSelectPlant: (cp: CanvasPlant) => void;
  onOpenPlantProfile: (cp: CanvasPlant) => void;
  onDeletePlant: (cp: CanvasPlant) => void;
}) {
  const accent =
    GARDEN_CATEGORY_ACCENT[group.category] ?? "var(--color-accent)";

  const plantList = (
    <ul className="garden-panel-category-list">
      {group.plants.map((cp) => (
        <GardenPlantRow
          key={cp.canvasId}
          plant={cp}
          selected={selectedCanvasPlantId === cp.canvasId}
          outsideZone={hasZones && plantOutsideOwnedZone(cp, zones)}
          onSelect={() => onSelectPlant(cp)}
          onOpenProfile={() => onOpenPlantProfile(cp)}
          onDelete={() => onDeletePlant(cp)}
        />
      ))}
    </ul>
  );

  const categoryLabel = (
    <>
      <span
        className="garden-panel-category-chip"
        style={{ background: accent }}
        aria-hidden
      />
      <span className="garden-panel-category-title">{group.category}</span>
      <span className="garden-panel-category-count">{group.plants.length}</span>
      {collapsible && (
        <span className="garden-panel-category-chevron" aria-hidden>
          ▾
        </span>
      )}
    </>
  );

  if (!collapsible) {
    return (
      <section className="garden-panel-category">
        <header className="garden-panel-category-head">{categoryLabel}</header>
        {plantList}
      </section>
    );
  }

  return (
    <details
      className="garden-panel-category garden-panel-category--collapsible"
      open={defaultOpen}
    >
      <summary className="garden-panel-category-head">{categoryLabel}</summary>
      {plantList}
    </details>
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
  const openCanvasPlantProfile = useDesignerStore((s) => s.openCanvasPlantProfile);
  const removePlant = useDesignerStore((s) => s.removePlant);
  const openGardenPlanSheet = useDesignerStore((s) => s.openGardenPlanSheet);
  const gardenProfile = useDesignerStore((s) => s.gardenProfile);
  const removeZone = useDesignerStore((s) => s.removeZone);
  const designerState = useDesignerStore((s) => s.designerState);

  const isMobile = useMatchMedia(MOBILE_LAYOUT_QUERY);
  const boundsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const triggerPositionedRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [spaceDetailsOpen, setSpaceDetailsOpen] = useState(false);
  const { panelRef, position, setPosition, dragHandleProps } =
    useFloatingPanelPosition(PANEL_POS_KEY, DEFAULT_PANEL_POS, boundsRef);
  const {
    panelRef: triggerWrapRef,
    position: triggerPosition,
    setPosition: setTriggerPosition,
    dragHandleProps: triggerDragProps,
  } = useFloatingPanelPosition(
    TRIGGER_POS_KEY,
    DEFAULT_TRIGGER_POS,
    boundsRef,
  );

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

  const showCategoryGroups = sorted.length > 0;
  const categoryGroups = useMemo(
    () => (showCategoryGroups ? groupGardenPlantsByCategory(sorted) : []),
    [showCategoryGroups, sorted],
  );
  const categorySectionsCollapsible = categoryGroups.length > 1;

  const hasZones = zones.length > 0;
  const listCount = sorted.length;
  const canManageSpace = Boolean(focusedZone);
  const canViewPlanProfile = Boolean(savedPlan?.profile || gardenProfile);
  const showEnhanceCta =
    focusedZone &&
    countFruitTreesInZone(canvasPlants, focusedZone, zones, designerState) > 0;
  const enhanceRecommended =
    focusedZone &&
    zoneNeedsGuildEnhance(canvasPlants, focusedZone, zones, designerState);

  useEffect(() => {
    setConfirmDelete(false);
    setSpaceDetailsOpen(false);
  }, [focusedZoneId]);

  useEffect(() => {
    if (confirmDelete) setSpaceDetailsOpen(true);
  }, [confirmDelete]);

  useEffect(() => {
    if (!isMobile || open || triggerPositionedRef.current) return;

    let stored = false;
    try {
      stored = Boolean(localStorage.getItem(TRIGGER_POS_KEY));
    } catch {
      stored = false;
    }
    if (stored) {
      triggerPositionedRef.current = true;
      return;
    }

    const applyTopCenter = () => {
      const anchored = topCenterPanelPosition(
        boundsRef.current,
        triggerWrapRef.current,
        { top: 8 },
      );
      if (anchored) {
        setTriggerPosition(anchored);
        triggerPositionedRef.current = true;
      }
      return anchored != null;
    };

    if (!applyTopCenter()) {
      requestAnimationFrame(applyTopCenter);
    }
  }, [isMobile, open, triggerWrapRef, setTriggerPosition]);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    const applyTopCenter = () => {
      let panelTop = 92;
      if (isMobile) {
        const wrap = triggerWrapRef.current;
        panelTop = wrap
          ? triggerPosition.y + wrap.offsetHeight + 10
          : triggerPosition.y + 48;
      } else {
        const trigger = triggerRef.current;
        panelTop = trigger
          ? trigger.offsetTop + trigger.offsetHeight + 14
          : 92;
      }
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
  }, [open, panelRef, setPosition, isMobile, triggerPosition.y, triggerWrapRef]);

  function onSelectPlant(cp: CanvasPlant) {
    selectCanvasPlant(cp.canvasId);
  }

  function onOpenPlantProfile(cp: CanvasPlant) {
    openCanvasPlantProfile(cp.canvasId);
  }

  function onDeletePlant(cp: CanvasPlant) {
    removePlant(cp.canvasId);
  }

  function confirmRemoveSpace() {
    if (!focusedZone) return;
    removeZone(focusedZone.id);
    setConfirmDelete(false);
  }

  if (count === 0) return null;

  const gardenTrigger = (
    <button
      ref={triggerRef}
      type="button"
      className={`designer-canvas-dock-pill designer-garden-trigger${open ? " is-open" : ""}`}
      aria-expanded={open}
      aria-controls="designer-garden-panel"
      onClick={() => setOpen(isMobile ? true : !open)}
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
        <span className="designer-canvas-dock-label designer-garden-trigger-label">
          Your garden
        </span>
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
  );

  return (
    <>
      <div
        ref={boundsRef}
        className="garden-panel-bounds"
        aria-hidden={!open && !isMobile}
      >
        {(!open || !isMobile) && (
          <div
            ref={triggerWrapRef as RefObject<HTMLDivElement>}
            className={`designer-garden-trigger-wrap${isMobile ? " is-mobile" : ""}`}
            style={
              isMobile && !open
                ? { left: triggerPosition.x, top: triggerPosition.y }
                : undefined
            }
          >
            {isMobile && !open && (
              <button
                type="button"
                className="designer-garden-trigger-grip"
                aria-label="Move your garden"
                title="Drag to move"
                {...triggerDragProps}
              >
                <svg viewBox="0 0 8 14" width="8" height="14" aria-hidden>
                  <circle cx="2" cy="2" r="1.25" fill="currentColor" />
                  <circle cx="6" cy="2" r="1.25" fill="currentColor" />
                  <circle cx="2" cy="7" r="1.25" fill="currentColor" />
                  <circle cx="6" cy="7" r="1.25" fill="currentColor" />
                  <circle cx="2" cy="12" r="1.25" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.25" fill="currentColor" />
                </svg>
              </button>
            )}
            {gardenTrigger}
          </div>
        )}
        {open && (
          <button
            type="button"
            className="garden-panel-backdrop"
            aria-label="Close garden list"
            onClick={() => setOpen(false)}
          />
        )}
        {open && (
          <aside
            id="designer-garden-panel"
            ref={panelRef}
            className={`garden-panel garden-panel--floating${isMobile ? " garden-panel--mobile" : ""}`}
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
                {canViewPlanProfile && (
                  <button
                    type="button"
                    className="garden-panel-view-plan"
                    onClick={() => openGardenPlanSheet()}
                  >
                    View plan profile
                  </button>
                )}
              </div>
            )}

            <ZoneSpaceSwitcher
              className="zone-space-switcher--panel"
              hideRename
            />

            {canManageSpace && focusedZone && (() => {
              const spaceCardStyle =
                focusedZoneIndex >= 0
                  ? { borderColor: `${zoneColor(focusedZoneIndex)}55` }
                  : undefined;

              const spaceCardBody = (
                <>
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
                      {savedPlan && (
                        <button
                          type="button"
                          className="garden-panel-view-plan garden-panel-view-plan--inline"
                          onClick={() =>
                            openGardenPlanSheet(focusedZone?.id ?? null)
                          }
                        >
                          View plan profile
                        </button>
                      )}
                      {showEnhanceCta && (
                        <button
                          type="button"
                          className="garden-panel-enhance-guild"
                          onClick={() =>
                            openEnhanceGuildSidebar(focusedZone?.id ?? null)
                          }
                        >
                          {enhanceRecommended
                            ? "Complete this guild"
                            : "Enhance understory"}
                        </button>
                      )}
                    </div>
                  </div>
                  {listCount === 0 ? (
                    confirmDelete ? (
                      <div className="garden-panel-delete-confirm" role="alert">
                        <p>
                          Delete empty bed <strong>{focusedZone.name}</strong>?
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
                            Delete bed
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="garden-panel-delete-space"
                        onClick={() => setConfirmDelete(true)}
                      >
                        Delete empty bed
                      </button>
                    )
                  ) : confirmDelete ? (
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
                  ) : zoneHasPlants(canvasPlants, focusedZone, zones) ? (
                    <button
                      type="button"
                      className="garden-panel-delete-space"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete this garden space
                    </button>
                  ) : null}
                </>
              );

              if (savedPlan) {
                return (
                  <details
                    className="garden-panel-space-card garden-panel-space-card--collapsible"
                    style={spaceCardStyle}
                    open={spaceDetailsOpen}
                    onToggle={(e) => setSpaceDetailsOpen(e.currentTarget.open)}
                  >
                    <summary className="garden-panel-space-card-summary">
                      {focusedZoneIndex >= 0 && (
                        <span
                          className="garden-panel-space-swatch"
                          style={{ background: zoneColor(focusedZoneIndex) }}
                          aria-hidden
                        />
                      )}
                      <span className="garden-panel-space-summary-text">
                        <span className="garden-panel-space-summary-name">
                          {focusedZone.name}
                        </span>
                        {savedPlan.profile.name && (
                          <span className="garden-panel-space-summary-plan">
                            {savedPlan.profile.name}
                          </span>
                        )}
                      </span>
                      <span
                        className="garden-panel-space-summary-chevron"
                        aria-hidden
                      >
                        ▾
                      </span>
                    </summary>
                    <div className="garden-panel-space-card-body">
                      {spaceCardBody}
                    </div>
                  </details>
                );
              }

              return (
                <div
                  className="garden-panel-space-card"
                  style={spaceCardStyle}
                >
                  {spaceCardBody}
                </div>
              );
            })()}

            <p className="garden-panel-hint">
              Tap a plant to select on the canvas; list icon opens its profile;
              trash removes it from the layout.
              {categorySectionsCollapsible
                ? " Tap a category to expand or collapse."
                : ""}
            </p>

            <div className="garden-panel-scroll">
              {showCategoryGroups ? (
                categoryGroups.map((group, index) => (
                  <GardenCategorySection
                    key={group.category}
                    group={group}
                    collapsible={categorySectionsCollapsible}
                    defaultOpen={
                      !categorySectionsCollapsible || index === 0
                    }
                    selectedCanvasPlantId={selectedCanvasPlantId}
                    hasZones={hasZones}
                    zones={zones}
                    onSelectPlant={onSelectPlant}
                    onOpenPlantProfile={onOpenPlantProfile}
                    onDeletePlant={onDeletePlant}
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
                      onOpenProfile={() => onOpenPlantProfile(cp)}
                      onDelete={() => onDeletePlant(cp)}
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
              {savedPlan && <EvergreenInstallCta compact />}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
