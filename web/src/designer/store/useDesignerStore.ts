import { create } from "zustand";
import type {
  PlantListItem,
  CanvasPlant,
  FilterKey,
  CanvasView,
} from "../types";
import type { CanopyLayer, Plant, PlantSummary } from "../../types";
import type { WorkspaceTool, WorkspaceZone } from "../types/workspace";
import {
  createCircleZone,
  createPolygonZone,
  createRectangleZone,
  defaultCircleCenter,
  defaultZoneAnchor,
  nextZoneName,
} from "./workspace-slice";
import { clampStagePos } from "../lib/clamp-stage-pos";
import { nearFirstDrawPoint } from "../lib/draw-zone-utils";
import {
  plantInsideZone,
  translateZone,
} from "../lib/zone-geometry";
import { resolveCompanionPlacement } from "../lib/companion-placement";
import type { LayoutPlacement } from "../lib/auto-populate";

type DesignerState = {
  canvasPlants: CanvasPlant[];
  selectedCanvasPlantId: string | null;
  zoom: number;
  canvasMode: "blank" | "photo";
  backgroundImageUrl: string | null;
  stagePos: { x: number; y: number };
  showRuler: boolean;
  canvasView: CanvasView;
  hiddenLayers: CanopyLayer[];

  workspacePanelOpen: boolean;
  gardenPanelOpen: boolean;
  zones: WorkspaceZone[];
  activeZoneId: string | null;
  workspaceTool: WorkspaceTool;
  drawPoints: { x: number; y: number }[];
  /** Rubber-band preview while drawing; cleared when pointer leaves canvas or UI. */
  drawCursor: { x: number; y: number } | null;
  zoneDragOrigin: {
    zone: WorkspaceZone;
    plants: { canvasId: string; x: number; y: number }[];
  } | null;

  selectedPlantId: string | null;
  searchQuery: string;
  categoryFilter: FilterKey | null;
  placementFlashCanvasId: string | null;
  /** After auto-fill: simpler rings & labels until user toggles off */
  compactCanvasVisuals: boolean;

  history: CanvasPlant[][];

  addPlant: (plant: PlantSummary | PlantListItem, x: number, y: number) => void;
  addPlantNearHost: (
    hostCanvasId: string,
    plant: PlantSummary | Plant,
    slotIndex?: number,
    totalSlots?: number,
  ) => void;
  clearPlacementFlash: () => void;
  removePlant: (canvasId: string) => void;
  deleteSelectedCanvasPlant: () => void;
  movePlant: (canvasId: string, x: number, y: number) => void;
  selectCanvasPlant: (canvasId: string | null) => void;
  selectSidebarPlant: (plantId: string | null) => void;
  closeDetailPanel: () => void;
  undo: () => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  resetCanvasView: () => void;
  setBackgroundImage: (url: string | null) => void;
  setCanvasMode: (mode: "blank" | "photo") => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (filter: FilterKey | null) => void;
  setShowRuler: (show: boolean) => void;
  setCanvasView: (view: CanvasView) => void;
  toggleLayerVisibility: (layer: CanopyLayer) => void;
  setCompactCanvasVisuals: (compact: boolean) => void;
  pushHistory: () => void;
  applyAutoPopulate: (
    placements: LayoutPlacement[],
    options: { zone?: WorkspaceZone; keepExistingZones?: boolean },
  ) => void;

  setWorkspacePanelOpen: (open: boolean) => void;
  setGardenPanelOpen: (open: boolean) => void;
  addRectangleZone: (widthFeet: number, heightFeet: number) => void;
  addCircleZone: (diameterFeet: number) => void;
  removeZone: (id: string) => void;
  setActiveZoneId: (id: string | null) => void;
  setWorkspaceTool: (tool: WorkspaceTool) => void;
  addDrawPoint: (x: number, y: number) => void;
  undoDrawPoint: () => void;
  setDrawCursor: (cursor: { x: number; y: number } | null) => void;
  finishDrawZone: () => void;
  cancelDrawZone: () => void;
  beginZoneDrag: (zoneId: string) => void;
  updateZoneDrag: (dx: number, dy: number) => void;
  endZoneDrag: () => void;
};

const DEFAULT_HEIGHT_BY_LAYER: Record<CanopyLayer, [number, number]> = {
  Overstory: [20, 35],
  Understory: [8, 14],
  Shrub: [4, 8],
  Herbaceous: [2, 5],
  Groundcover: [0.5, 1.5],
  Root: [0, 0],
  Vine: [6, 12],
};

function toCanvasPlant(
  plant: PlantSummary | PlantListItem,
  x: number,
  y: number,
): CanvasPlant {
  return {
    canvasId: crypto.randomUUID(),
    plantId: plant.id,
    trefle_id: "trefle_id" in plant ? plant.trefle_id : undefined,
    common_name: plant.common_name,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    canvas_radius_feet: plant.canvas_radius_feet || 3,
    mature_height_feet:
      plant.mature_height_feet ??
      DEFAULT_HEIGHT_BY_LAYER[plant.canopy_layer] ??
      [6, 12],
    image_url: plant.image_url,
    is_invasive_in_florida: plant.is_invasive_in_florida ?? false,
    x,
    y,
  };
}

export const INITIAL_CANVAS_ZOOM = 1;
export const INITIAL_STAGE_POS = { x: 0, y: 0 };

export const useDesignerStore = create<DesignerState>((set, get) => ({
  canvasPlants: [],
  selectedCanvasPlantId: null,
  zoom: 1,
  canvasMode: "blank",
  backgroundImageUrl: null,
  stagePos: { x: 0, y: 0 },
  showRuler: true,
  canvasView: "top-down",
  hiddenLayers: [],

  workspacePanelOpen: true,
  gardenPanelOpen: false,
  zones: [],
  activeZoneId: null,
  workspaceTool: "select",
  drawPoints: [],
  drawCursor: null,
  zoneDragOrigin: null,

  selectedPlantId: null,
  searchQuery: "",
  categoryFilter: null,
  placementFlashCanvasId: null,
  compactCanvasVisuals: false,

  history: [],

  pushHistory: () => {
    const snap = structuredClone(get().canvasPlants);
    set((s) => ({ history: [...s.history.slice(-30), snap] }));
  },

  applyAutoPopulate: (placements, options) => {
    get().pushHistory();
    const canvasPlants = placements.map(({ plant, x, y }) =>
      toCanvasPlant(plant, x, y),
    );
    const keepZones = options.keepExistingZones === true;
    const zone = options.zone;
    set({
      canvasPlants,
      ...(keepZones
        ? { activeZoneId: zone?.id ?? get().activeZoneId }
        : {
            zones: zone ? [zone] : [],
            activeZoneId: zone?.id ?? null,
          }),
      workspaceTool: "select",
      drawPoints: [],
      drawCursor: null,
      canvasView: "top-down",
      selectedCanvasPlantId: null,
      selectedPlantId: null,
      placementFlashCanvasId: null,
      showRuler: true,
      compactCanvasVisuals: false,
    });
    get().resetCanvasView();
  },

  addPlant: (plant, x, y) => {
    get().pushHistory();
    const cp = toCanvasPlant(plant, x, y);
    set((s) => ({
      canvasPlants: [...s.canvasPlants, cp],
      selectedCanvasPlantId: cp.canvasId,
    }));
  },

  addPlantNearHost: (hostCanvasId, plant, slotIndex = 0, totalSlots = 1) => {
    const host = get().canvasPlants.find((p) => p.canvasId === hostCanvasId);
    if (!host) return;

    const slots = Math.max(1, totalSlots);
    const idx = Math.min(Math.max(0, slotIndex), slots - 1);
    const { x, y } = resolveCompanionPlacement(
      host,
      plant.canvas_radius_feet || 3,
      idx,
      slots,
      get().canvasPlants,
    );

    get().pushHistory();
    const cp = toCanvasPlant(plant, x, y);
    set((s) => ({
      canvasPlants: [...s.canvasPlants, cp],
      // Keep the host selected so Plant nearby stays open for more companions.
      selectedCanvasPlantId: hostCanvasId,
      placementFlashCanvasId: cp.canvasId,
    }));

    window.setTimeout(() => {
      if (get().placementFlashCanvasId === cp.canvasId) {
        get().clearPlacementFlash();
      }
    }, 1400);
  },

  clearPlacementFlash: () => set({ placementFlashCanvasId: null }),

  removePlant: (canvasId) => {
    get().pushHistory();
    set((s) => ({
      canvasPlants: s.canvasPlants.filter((p) => p.canvasId !== canvasId),
      selectedCanvasPlantId:
        s.selectedCanvasPlantId === canvasId ? null : s.selectedCanvasPlantId,
      selectedPlantId:
        s.selectedCanvasPlantId === canvasId &&
        s.canvasPlants.find((p) => p.canvasId === canvasId)?.plantId ===
          s.selectedPlantId
          ? null
          : s.selectedPlantId,
    }));
  },

  deleteSelectedCanvasPlant: () => {
    const id = get().selectedCanvasPlantId;
    if (!id) return;
    get().removePlant(id);
  },

  movePlant: (canvasId, x, y) => {
    set((s) => ({
      canvasPlants: s.canvasPlants.map((p) =>
        p.canvasId === canvasId ? { ...p, x, y } : p,
      ),
    }));
  },

  selectCanvasPlant: (canvasId) => set({ selectedCanvasPlantId: canvasId }),
  selectSidebarPlant: (plantId) => set({ selectedPlantId: plantId }),
  closeDetailPanel: () =>
    set({ selectedPlantId: null, selectedCanvasPlantId: null }),

  undo: () => {
    const { history } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({
      canvasPlants: prev,
      history: history.slice(0, -1),
    });
  },

  setZoom: (zoom) => set({ zoom: Math.min(2.5, Math.max(0.4, zoom)) }),
  setStagePos: (stagePos) => set({ stagePos: clampStagePos(stagePos) }),
  resetCanvasView: () =>
    set({
      zoom: INITIAL_CANVAS_ZOOM,
      stagePos: { ...INITIAL_STAGE_POS },
    }),
  setBackgroundImage: (backgroundImageUrl) => set({ backgroundImageUrl }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setShowRuler: (showRuler) => set({ showRuler }),
  setCanvasView: (canvasView) => set({ canvasView }),
  toggleLayerVisibility: (layer) =>
    set((s) => ({
      hiddenLayers: s.hiddenLayers.includes(layer)
        ? s.hiddenLayers.filter((l) => l !== layer)
        : [...s.hiddenLayers, layer],
    })),

  setCompactCanvasVisuals: (compactCanvasVisuals) => set({ compactCanvasVisuals }),

  setWorkspacePanelOpen: (workspacePanelOpen) => set({ workspacePanelOpen }),
  setGardenPanelOpen: (gardenPanelOpen) => set({ gardenPanelOpen }),

  addRectangleZone: (widthFeet, heightFeet) => {
    const anchor = defaultZoneAnchor(widthFeet, heightFeet);
    const zone = createRectangleZone(
      widthFeet,
      heightFeet,
      anchor,
      nextZoneName(get().zones),
    );
    set((s) => ({
      zones: [...s.zones, zone],
      activeZoneId: zone.id,
      workspaceTool: "select",
    }));
  },

  addCircleZone: (diameterFeet) => {
    const center = defaultCircleCenter(diameterFeet);
    const zone = createCircleZone(
      diameterFeet,
      center,
      nextZoneName(get().zones),
    );
    set((s) => ({
      zones: [...s.zones, zone],
      activeZoneId: zone.id,
      workspaceTool: "select",
    }));
  },

  removeZone: (id) =>
    set((s) => ({
      zones: s.zones.filter((z) => z.id !== id),
      activeZoneId: s.activeZoneId === id ? null : s.activeZoneId,
    })),

  setActiveZoneId: (activeZoneId) => set({ activeZoneId }),

  setWorkspaceTool: (workspaceTool) =>
    set({
      workspaceTool,
      drawPoints: workspaceTool === "draw-zone" ? [] : [],
      drawCursor: null,
    }),

  setDrawCursor: (drawCursor) => set({ drawCursor }),

  addDrawPoint: (x, y) => {
    const s = get();
    if (s.workspaceTool !== "draw-zone") return;
    if (nearFirstDrawPoint(s.drawPoints, x, y)) {
      get().finishDrawZone();
      return;
    }
    set({
      drawPoints: [...s.drawPoints, { x, y }],
      drawCursor: null,
    });
  },

  undoDrawPoint: () =>
    set((s) => ({
      drawPoints: s.drawPoints.slice(0, -1),
      drawCursor: null,
    })),

  finishDrawZone: () => {
    const pts = get().drawPoints;
    if (pts.length < 3) {
      set({ drawPoints: [], drawCursor: null, workspaceTool: "select" });
      return;
    }
    const zone = createPolygonZone(pts, nextZoneName(get().zones));
    set((s) => ({
      zones: [...s.zones, zone],
      activeZoneId: zone.id,
      drawPoints: [],
      drawCursor: null,
      workspaceTool: "select",
    }));
  },

  cancelDrawZone: () =>
    set({ drawPoints: [], drawCursor: null, workspaceTool: "select" }),

  beginZoneDrag: (zoneId) => {
    const zone = get().zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const plants = get()
      .canvasPlants.filter((p) => plantInsideZone(p.x, p.y, zone))
      .map((p) => ({ canvasId: p.canvasId, x: p.x, y: p.y }));
    set({
      zoneDragOrigin: { zone: structuredClone(zone), plants },
      activeZoneId: zoneId,
    });
  },

  updateZoneDrag: (dx, dy) => {
    const origin = get().zoneDragOrigin;
    if (!origin) return;
    const movedZone = translateZone(origin.zone, dx, dy);
    const plantIds = new Set(origin.plants.map((p) => p.canvasId));
    set((s) => ({
      zones: s.zones.map((z) => (z.id === movedZone.id ? movedZone : z)),
      canvasPlants: s.canvasPlants.map((p) => {
        if (!plantIds.has(p.canvasId)) return p;
        const start = origin.plants.find((o) => o.canvasId === p.canvasId);
        if (!start) return p;
        return { ...p, x: start.x + dx, y: start.y + dy };
      }),
    }));
  },

  endZoneDrag: () => {
    if (!get().zoneDragOrigin) return;
    get().pushHistory();
    set({ zoneDragOrigin: null });
  },
}));
