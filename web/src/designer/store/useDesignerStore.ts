import { create } from "zustand";
import type { PlantListItem, CanvasPlant, FilterKey } from "../types";
import type { PlantSummary } from "../../types";
import type { WorkspaceTool, WorkspaceZone } from "../types/workspace";
import {
  createCircleZone,
  createPolygonZone,
  createRectangleZone,
  defaultCircleCenter,
  defaultZoneAnchor,
  nextZoneName,
} from "./workspace-slice";
import {
  plantInsideZone,
  translateZone,
} from "../lib/zone-geometry";

type DesignerState = {
  canvasPlants: CanvasPlant[];
  selectedCanvasPlantId: string | null;
  zoom: number;
  canvasMode: "blank" | "photo";
  backgroundImageUrl: string | null;
  stagePos: { x: number; y: number };
  showRuler: boolean;

  workspacePanelOpen: boolean;
  zones: WorkspaceZone[];
  activeZoneId: string | null;
  workspaceTool: WorkspaceTool;
  drawPoints: { x: number; y: number }[];
  zoneDragOrigin: {
    zone: WorkspaceZone;
    plants: { canvasId: string; x: number; y: number }[];
  } | null;

  selectedPlantId: string | null;
  searchQuery: string;
  categoryFilter: FilterKey | null;

  history: CanvasPlant[][];

  addPlant: (plant: PlantSummary | PlantListItem, x: number, y: number) => void;
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
  pushHistory: () => void;

  setWorkspacePanelOpen: (open: boolean) => void;
  addRectangleZone: (widthFeet: number, heightFeet: number) => void;
  addCircleZone: (diameterFeet: number) => void;
  removeZone: (id: string) => void;
  setActiveZoneId: (id: string | null) => void;
  setWorkspaceTool: (tool: WorkspaceTool) => void;
  addDrawPoint: (x: number, y: number) => void;
  finishDrawZone: () => void;
  cancelDrawZone: () => void;
  beginZoneDrag: (zoneId: string) => void;
  updateZoneDrag: (dx: number, dy: number) => void;
  endZoneDrag: () => void;
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
    canopy_layer: plant.canopy_layer,
    canvas_radius_feet: plant.canvas_radius_feet || 3,
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

  workspacePanelOpen: true,
  zones: [],
  activeZoneId: null,
  workspaceTool: "select",
  drawPoints: [],
  zoneDragOrigin: null,

  selectedPlantId: null,
  searchQuery: "",
  categoryFilter: null,

  history: [],

  pushHistory: () => {
    const snap = structuredClone(get().canvasPlants);
    set((s) => ({ history: [...s.history.slice(-30), snap] }));
  },

  addPlant: (plant, x, y) => {
    get().pushHistory();
    const cp = toCanvasPlant(plant, x, y);
    set((s) => ({
      canvasPlants: [...s.canvasPlants, cp],
      selectedCanvasPlantId: cp.canvasId,
    }));
  },

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
  setStagePos: (stagePos) => set({ stagePos }),
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

  setWorkspacePanelOpen: (workspacePanelOpen) => set({ workspacePanelOpen }),

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
      drawPoints: workspaceTool === "draw-zone" ? [] : get().drawPoints,
    }),

  addDrawPoint: (x, y) =>
    set((s) => ({
      drawPoints: [...s.drawPoints, { x, y }],
    })),

  finishDrawZone: () => {
    const pts = get().drawPoints;
    if (pts.length < 3) {
      set({ drawPoints: [], workspaceTool: "select" });
      return;
    }
    const zone = createPolygonZone(pts, nextZoneName(get().zones));
    set((s) => ({
      zones: [...s.zones, zone],
      activeZoneId: zone.id,
      drawPoints: [],
      workspaceTool: "select",
    }));
  },

  cancelDrawZone: () =>
    set({ drawPoints: [], workspaceTool: "select" }),

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
