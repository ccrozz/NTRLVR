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
import {
  resizeRectangleZone,
  scalePlantsToZoneBounds,
  type ZoneResizeCorner,
} from "../lib/zone-resize";
import { nearFirstDrawPoint } from "../lib/draw-zone-utils";
import {
  getZoneBounds,
  plantBelongsToZone,
  pointInZone,
  primaryZoneAtPoint,
  stampMissingPlantZoneIds,
  translateZone,
} from "../lib/zone-geometry";
import { resolveCompanionPlacement } from "../lib/companion-placement";
import type { LayoutPlacement } from "../lib/auto-populate";
import { zoneHasPlants } from "../lib/zone-plant-groups";
import {
  anchorZone,
  nextZoneAnchor,
  offsetPlacements,
  zonePlacementOffset,
} from "../lib/workspace-placement";
import type { GardenGenerateResult } from "@lib/garden-generate";
import type {
  GardenProfile,
  QuestionnaireDraft,
  RecommendedPlantMeta,
  ZoneGardenPlan,
} from "../types/garden-plan";
import { layoutForPlan } from "../lib/garden-onboarding-run";
import { focusDesignerCanvas } from "../lib/focus-designer-canvas";
import { isMobileDesignerLayout } from "../lib/mobile-layout";
import {
  buildZoneGardenPlan,
  planToSidebarFields,
} from "../lib/zone-plan-sidebar";
import type { DesignerStateCode } from "@lib/designer-states";
import { saveDesignerState } from "../lib/designer-state-prefs";
import { loadDesignerState } from "../lib/designer-state-prefs";

function planSheetVisibilityPatch(open: boolean): Partial<DesignerState> {
  if (!open) return { planSheetOpen: false };
  if (typeof window !== "undefined") {
    focusDesignerCanvas();
  }
  return {
    planSheetOpen: true,
    gardenPanelOpen: false,
    mobileSidebarOpen: false,
    mobileToolsOpen: false,
  };
}

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
  zoneResizeOrigin: {
    zone: WorkspaceZone;
    plants: { canvasId: string; x: number; y: number }[];
    corner: ZoneResizeCorner;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
  } | null;

  selectedPlantId: string | null;
  searchQuery: string;
  categoryFilter: FilterKey | null;
  placementFlashCanvasId: string | null;
  /** After auto-fill: simpler rings & labels until user toggles off */
  compactCanvasVisuals: boolean;
  gardenVision: {
    name: string;
    description: string;
    philosophy: string;
  } | null;

  /** Active US state for catalog & Build For Me (FL, TN, CT). */
  designerState: DesignerStateCode;
  setDesignerState: (code: DesignerStateCode) => void;

  sidebarMode: "browse" | "build";
  showingRecommendations: boolean;
  recommendedPlantIds: string[] | null;
  recommendationMeta: Record<string, RecommendedPlantMeta>;
  gardenProfile: GardenProfile | null;
  lastGenerateResult: GardenGenerateResult | null;
  questionnaireDraft: QuestionnaireDraft | null;
  /** Bumped to remount Build For Me from a clean slate. */
  buildForMeSession: number;
  /** Bed used in Build For Me for size reference only (not auto-fill on place). */
  planCanvasZoneId: string | null;
  planSheetOpen: boolean;
  /** Filter garden / recommendation lists by workspace zone (`all` = every space). */
  spaceListZoneId: "all" | string;
  /** Per-bed saved plans after Place on canvas. */
  zoneGardenPlans: Record<string, ZoneGardenPlan>;
  /** Latest generated plan not yet placed on canvas. */
  pendingGardenPlan: ZoneGardenPlan | null;
  /** True after a plan is generated this session; cleared on fresh designer load. */
  buildResultsReady: boolean;
  /** True after Place on canvas succeeds — prevents duplicate beds on repeat clicks. */
  gardenPlanPlacedOnCanvas: boolean;

  history: CanvasPlant[][];
  redoHistory: CanvasPlant[][];

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
  openCanvasPlantProfile: (canvasId: string) => void;
  closeDetailPanel: () => void;
  /** Clear plant selection and active bed focus (e.g. empty canvas click or pan). */
  dismissCanvasFocus: () => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  resetCanvasView: () => void;
  /** Bumped after placing a garden plan so the canvas can center on new content (mobile). */
  canvasFitTick: number;
  requestCanvasFit: () => void;
  placingGardenOnCanvas: boolean;
  setBackgroundImage: (url: string | null) => void;
  setCanvasMode: (mode: "blank" | "photo") => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (filter: FilterKey | null) => void;
  setShowRuler: (show: boolean) => void;
  setCanvasView: (view: CanvasView) => void;
  toggleLayerVisibility: (layer: CanopyLayer) => void;
  setCompactCanvasVisuals: (compact: boolean) => void;
  setSidebarMode: (mode: "browse" | "build") => void;
  /** Mobile bottom sheet: plants / build panel over canvas */
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  /** Mobile bottom sheet: canvas tools above tab bar */
  mobileToolsOpen: boolean;
  setMobileToolsOpen: (open: boolean) => void;
  setQuestionnaireDraft: (draft: QuestionnaireDraft | null) => void;
  setShowingRecommendations: (show: boolean) => void;
  setPlanSheetOpen: (open: boolean) => void;
  /** Open the full garden plan sheet (from Your garden or Build results). */
  openGardenPlanSheet: (zoneId?: string | null) => void;
  setSpaceListZoneId: (id: "all" | string) => void;
  renameZone: (id: string, name: string) => void;
  /** Reset UI that should not carry over when opening the designer page. */
  prepareDesignerOnLoad: () => void;
  applyGardenPlan: (payload: {
    profile: GardenProfile;
    result: GardenGenerateResult;
    recommendations: RecommendedPlantMeta[];
    canvasZoneId?: string | null;
  }) => void;
  clearGardenPlan: () => void;
  /** Show the latest unplaced Build For Me plan in the sidebar. */
  showPendingGardenPlan: () => void;
  /** Clear recommendations and restart the Build For Me questionnaire. */
  resetBuildForMe: () => void;
  placeRecommendedOnCanvas: () => Promise<void>;
  pushHistory: () => void;
  applyAutoPopulate: (
    placements: LayoutPlacement[],
    options: {
      zone?: WorkspaceZone;
      /** Fill this zone only when empty, unless replacePlantsInZone is set. */
      fillZoneId?: string;
      /** Replace plants inside fillZoneId even when that bed already has plants. */
      replacePlantsInZone?: boolean;
      /** Add a new bed beside existing layout (default when anything is already on canvas). */
      mergeWithExisting?: boolean;
      /** Label for a newly added bed (defaults to "Bed N"). */
      zoneName?: string;
      gardenVision?: {
        name: string;
        description: string;
        philosophy: string;
      } | null;
    },
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
  beginZoneResize: (zoneId: string, corner: ZoneResizeCorner) => void;
  updateZoneResize: (
    corner: ZoneResizeCorner,
    pointerX: number,
    pointerY: number,
  ) => void;
  endZoneResize: () => void;
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
  zoneId: string | null = null,
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
    zoneId,
  };
}

function zoneIdForPlacement(
  x: number,
  y: number,
  zones: WorkspaceZone[],
  activeZoneId: string | null,
): string | null {
  if (!zones.length) return null;
  if (activeZoneId) {
    const active = zones.find((z) => z.id === activeZoneId);
    if (active && pointInZone(x, y, active)) return activeZoneId;
  }
  return primaryZoneAtPoint(x, y, zones)?.id ?? null;
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

  workspacePanelOpen: false,
  gardenPanelOpen: false,
  zones: [],
  activeZoneId: null,
  workspaceTool: "select",
  drawPoints: [],
  drawCursor: null,
  zoneDragOrigin: null,
  zoneResizeOrigin: null,

  selectedPlantId: null,
  searchQuery: "",
  categoryFilter: null,
  placementFlashCanvasId: null,
  compactCanvasVisuals: false,
  gardenVision: null,

  designerState: loadDesignerState(),
  sidebarMode: "browse",
  mobileSidebarOpen: false,
  mobileToolsOpen: false,
  showingRecommendations: false,
  recommendedPlantIds: null,
  recommendationMeta: {},
  gardenProfile: null,
  lastGenerateResult: null,
  questionnaireDraft: null,
  buildForMeSession: 0,
  planCanvasZoneId: null,
  planSheetOpen: false,
  spaceListZoneId: "all",
  zoneGardenPlans: {},
  pendingGardenPlan: null,
  buildResultsReady: false,
  gardenPlanPlacedOnCanvas: false,
  canvasFitTick: 0,
  placingGardenOnCanvas: false,

  history: [],
  redoHistory: [],

  pushHistory: () => {
    const snap = structuredClone(get().canvasPlants);
    set((s) => ({
      history: [...s.history.slice(-30), snap],
      redoHistory: [],
    }));
  },

  applyAutoPopulate: (placements, options) => {
    get().pushHistory();
    const state = get();
    const zone = options.zone;
    if (!zone) return;

    const hasLayout =
      state.zones.length > 0 || state.canvasPlants.length > 0;
    const shouldMerge =
      options.mergeWithExisting !== false && hasLayout;

    if (options.fillZoneId) {
      const target =
        state.zones.find((z) => z.id === options.fillZoneId) ?? zone;
      const occupied = zoneHasPlants(state.canvasPlants, target, state.zones);
      if (!occupied || options.replacePlantsInZone) {
        const kept = state.canvasPlants.filter(
          (p) => !plantBelongsToZone(p, target, state.zones),
        );
        const added = placements.map(({ plant, x, y }) =>
          toCanvasPlant(plant, x, y, target.id),
        );
        set({
          canvasPlants: [...kept, ...added],
          zones: state.zones,
          activeZoneId: target.id,
          gardenVision: options.gardenVision ?? state.gardenVision,
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
        return;
      }
    }

    if (shouldMerge) {
      const w = zone.widthFeet ?? 20;
      const h = zone.heightFeet ?? 20;
      const anchor = nextZoneAnchor(state.zones, w, h);
      const { dx, dy } = zonePlacementOffset(zone, anchor);
      const positionedZone = {
        ...anchorZone(zone, anchor),
        name: options.zoneName?.trim() || nextZoneName(state.zones),
      };
      const added = offsetPlacements(placements, dx, dy).map(({ plant, x, y }) =>
        toCanvasPlant(plant, x, y, positionedZone.id),
      );
      set({
        canvasPlants: [...state.canvasPlants, ...added],
        zones: [...state.zones, positionedZone],
        activeZoneId: positionedZone.id,
        gardenVision: options.gardenVision ?? state.gardenVision,
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
      return;
    }

    const firstZone = {
      ...zone,
      name: options.zoneName?.trim() || zone.name || nextZoneName([]),
    };
    set({
      canvasPlants: placements.map(({ plant, x, y }) =>
        toCanvasPlant(plant, x, y, firstZone.id),
      ),
      zones: [firstZone],
      activeZoneId: firstZone.id,
      gardenVision: options.gardenVision ?? state.gardenVision,
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
    const s = get();
    const zoneId = zoneIdForPlacement(x, y, s.zones, s.activeZoneId);
    const cp = toCanvasPlant(plant, x, y, zoneId);
    set((state) => ({
      canvasPlants: [...state.canvasPlants, cp],
      // Placement only — profile opens on intentional tap (sidebar or canvas).
      selectedCanvasPlantId: null,
      selectedPlantId: null,
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
    const cp = toCanvasPlant(plant, x, y, host.zoneId);
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

  selectCanvasPlant: (canvasId) =>
    set({
      selectedCanvasPlantId: canvasId,
      selectedPlantId: null,
    }),
  openCanvasPlantProfile: (canvasId) =>
    set((s) => {
      const cp = s.canvasPlants.find((p) => p.canvasId === canvasId);
      if (!cp) return {};
      return {
        selectedCanvasPlantId: canvasId,
        selectedPlantId: cp.plantId,
      };
    }),
  selectSidebarPlant: (plantId) =>
    set((s) => {
      const onCanvas = s.canvasPlants.find(
        (p) => p.canvasId === s.selectedCanvasPlantId,
      );
      const keepCanvasSelection =
        Boolean(onCanvas) && onCanvas!.plantId === plantId;
      return {
        selectedPlantId: plantId,
        selectedCanvasPlantId: keepCanvasSelection
          ? s.selectedCanvasPlantId
          : null,
      };
    }),
  closeDetailPanel: () =>
    set({ selectedPlantId: null, selectedCanvasPlantId: null }),
  dismissCanvasFocus: () =>
    set({
      selectedPlantId: null,
      selectedCanvasPlantId: null,
      activeZoneId: null,
    }),

  undo: () => {
    const { history, canvasPlants, redoHistory } = get();
    if (!history.length) return;
    const prev = history[history.length - 1]!;
    set({
      canvasPlants: prev,
      history: history.slice(0, -1),
      redoHistory: [
        ...redoHistory.slice(-30),
        structuredClone(canvasPlants),
      ],
      selectedCanvasPlantId: null,
      selectedPlantId: null,
    });
  },

  redo: () => {
    const { redoHistory, canvasPlants, history } = get();
    if (!redoHistory.length) return;
    const next = redoHistory[redoHistory.length - 1]!;
    set({
      canvasPlants: next,
      redoHistory: redoHistory.slice(0, -1),
      history: [...history.slice(-30), structuredClone(canvasPlants)],
      selectedCanvasPlantId: null,
      selectedPlantId: null,
    });
  },

  setZoom: (zoom) => set({ zoom: Math.min(2.5, Math.max(0.4, zoom)) }),
  setStagePos: (stagePos) => set({ stagePos: clampStagePos(stagePos) }),
  resetCanvasView: () =>
    set({
      zoom: INITIAL_CANVAS_ZOOM,
      stagePos: { ...INITIAL_STAGE_POS },
    }),
  requestCanvasFit: () =>
    set((s) => ({ canvasFitTick: s.canvasFitTick + 1 })),
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

  setDesignerState: (designerState) => {
    saveDesignerState(designerState);
    set({
      designerState,
      categoryFilter: null,
      searchQuery: "",
      buildResultsReady: false,
      gardenPlanPlacedOnCanvas: false,
      recommendedPlantIds: null,
      recommendationMeta: {},
      gardenProfile: null,
      lastGenerateResult: null,
      pendingGardenPlan: null,
      questionnaireDraft: null,
      buildForMeSession: get().buildForMeSession + 1,
    });
  },

  setSidebarMode: (sidebarMode) => set({ sidebarMode }),

  setMobileSidebarOpen: (mobileSidebarOpen) =>
    set(
      mobileSidebarOpen
        ? { mobileSidebarOpen: true, mobileToolsOpen: false }
        : { mobileSidebarOpen: false },
    ),

  setMobileToolsOpen: (mobileToolsOpen) =>
    set(
      mobileToolsOpen
        ? { mobileToolsOpen: true, mobileSidebarOpen: false }
        : { mobileToolsOpen: false },
    ),

  setQuestionnaireDraft: (questionnaireDraft) => set({ questionnaireDraft }),

  setShowingRecommendations: (showingRecommendations) =>
    set({ showingRecommendations }),

  setPlanSheetOpen: (planSheetOpen) => set(planSheetVisibilityPatch(planSheetOpen)),

  openGardenPlanSheet: (zoneId) => {
    const s = get();
    const resolvedZoneId =
      zoneId && zoneId !== "all"
        ? zoneId
        : s.spaceListZoneId !== "all"
          ? s.spaceListZoneId
          : null;

    if (resolvedZoneId) {
      const plan = s.zoneGardenPlans[resolvedZoneId];
      if (plan) {
        set({
          ...planToSidebarFields(plan),
          ...planSheetVisibilityPatch(true),
          planCanvasZoneId: resolvedZoneId,
          gardenPlanPlacedOnCanvas: true,
          activeZoneId: resolvedZoneId,
          spaceListZoneId: resolvedZoneId,
        });
        return;
      }
    }

    if (s.gardenProfile) {
      set(planSheetVisibilityPatch(true));
    }
  },

  prepareDesignerOnLoad: () =>
    set({
      workspacePanelOpen: false,
      sidebarMode: "browse",
      mobileSidebarOpen: false,
      mobileToolsOpen: false,
      buildResultsReady: false,
      gardenPlanPlacedOnCanvas: false,
    }),

  setSpaceListZoneId: (spaceListZoneId) => {
    if (spaceListZoneId === "all") {
      set({ spaceListZoneId });
      return;
    }
    const s = get();
    const plan = s.zoneGardenPlans[spaceListZoneId];
    if (plan) {
      set({
        spaceListZoneId,
        activeZoneId: spaceListZoneId,
        planCanvasZoneId: spaceListZoneId,
        ...planToSidebarFields(plan),
      });
      return;
    }
    set({
      spaceListZoneId,
      activeZoneId: spaceListZoneId,
      showingRecommendations: false,
      recommendedPlantIds: null,
      recommendationMeta: {},
      gardenProfile: null,
      lastGenerateResult: null,
      planCanvasZoneId: null,
      gardenVision: null,
    });
  },

  renameZone: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({
      zones: s.zones.map((z) =>
        z.id === id ? { ...z, name: trimmed } : z,
      ),
    }));
  },

  applyGardenPlan: ({ profile, result, recommendations, canvasZoneId }) => {
    const plan = buildZoneGardenPlan({ profile, result, recommendations });
    set({
      pendingGardenPlan: plan,
      planCanvasZoneId: canvasZoneId ?? null,
      sidebarMode: "build",
      buildResultsReady: true,
      gardenPlanPlacedOnCanvas: false,
      ...planToSidebarFields(plan),
    });
  },

  clearGardenPlan: () =>
    set({
      showingRecommendations: false,
      recommendedPlantIds: null,
      recommendationMeta: {},
      gardenProfile: null,
      lastGenerateResult: null,
      planCanvasZoneId: null,
      planSheetOpen: false,
      gardenVision: null,
      pendingGardenPlan: null,
      gardenPlanPlacedOnCanvas: false,
    }),

  showPendingGardenPlan: () => {
    const pending = get().pendingGardenPlan;
    if (!pending) return;
    set(planToSidebarFields(pending));
  },

  resetBuildForMe: () =>
    set((s) => ({
      showingRecommendations: false,
      recommendedPlantIds: null,
      recommendationMeta: {},
      gardenProfile: null,
      lastGenerateResult: null,
      planCanvasZoneId: null,
      planSheetOpen: false,
      gardenVision: null,
      pendingGardenPlan: null,
      buildResultsReady: false,
      gardenPlanPlacedOnCanvas: false,
      questionnaireDraft: null,
      sidebarMode: "build",
      buildForMeSession: s.buildForMeSession + 1,
    })),

  placeRecommendedOnCanvas: async () => {
    const s = get();
    const result = s.lastGenerateResult;
    if (!result) return;

    focusDesignerCanvas();

    if (s.gardenPlanPlacedOnCanvas && s.planCanvasZoneId) {
      const zoneId = s.planCanvasZoneId;
      set({
        activeZoneId: zoneId,
        spaceListZoneId: zoneId,
        planSheetOpen: false,
        sidebarMode: "browse",
        mobileSidebarOpen: false,
        mobileToolsOpen: false,
      });
      if (isMobileDesignerLayout()) {
        get().requestCanvasFit();
      }
      return;
    }

    set({ placingGardenOnCanvas: true });

    const profile = s.gardenProfile;
    const pending =
      s.pendingGardenPlan ??
      (profile
        ? buildZoneGardenPlan({
            profile,
            result,
            recommendations: Object.values(s.recommendationMeta),
          })
        : null);

    try {
      const fillZone = s.planCanvasZoneId
        ? s.zones.find((z) => z.id === s.planCanvasZoneId)
        : undefined;
      const { zone, placements } = await layoutForPlan(
        result,
        fillZone ?? undefined,
      );
      const hasLayout = s.zones.length > 0 || s.canvasPlants.length > 0;
      const bedLabel = profile?.name?.trim()
        ? profile.name.trim().slice(0, 48)
        : undefined;
      const gardenVision = profile
        ? {
            name: profile.name,
            description: profile.description,
            philosophy: profile.philosophy,
          }
        : null;

      if (fillZone) {
        get().applyAutoPopulate(placements, {
          zone: fillZone,
          fillZoneId: fillZone.id,
          replacePlantsInZone: zoneHasPlants(
            s.canvasPlants,
            fillZone,
            s.zones,
          ),
          mergeWithExisting: false,
          zoneName: bedLabel,
          gardenVision,
        });
      } else {
        get().applyAutoPopulate(placements, {
          zone,
          mergeWithExisting: hasLayout,
          zoneName: bedLabel,
          gardenVision,
        });
      }

      const newZoneId = get().activeZoneId;
      if (newZoneId && pending) {
        set((state) => ({
          zoneGardenPlans: {
            ...state.zoneGardenPlans,
            [newZoneId]: pending,
          },
          pendingGardenPlan: null,
          planCanvasZoneId: newZoneId,
          spaceListZoneId: newZoneId,
          activeZoneId: newZoneId,
          gardenPlanPlacedOnCanvas: true,
          sidebarMode: "browse",
          mobileSidebarOpen: false,
          mobileToolsOpen: false,
          ...planToSidebarFields(pending),
          planSheetOpen: false,
        }));
      } else {
        set({
          planSheetOpen: false,
          gardenPlanPlacedOnCanvas: true,
          sidebarMode: "browse",
          mobileSidebarOpen: false,
          mobileToolsOpen: false,
        });
      }

      if (isMobileDesignerLayout()) {
        get().requestCanvasFit();
      }
    } finally {
      set({ placingGardenOnCanvas: false });
    }
  },

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

  removeZone: (id) => {
    const s = get();
    const zone = s.zones.find((z) => z.id === id);
    if (!zone) return;
    get().pushHistory();
    set((state) => {
      const { [id]: _removed, ...restPlans } = state.zoneGardenPlans;
      const nextSpace =
        state.spaceListZoneId === id ? "all" : state.spaceListZoneId;
      const removedIds = new Set(
        state.canvasPlants
          .filter((p) => plantBelongsToZone(p, zone, state.zones))
          .map((p) => p.canvasId),
      );
      const canvasPlants = state.canvasPlants.filter(
        (p) => !removedIds.has(p.canvasId),
      );
      const selectedCanvasPlantId =
        state.selectedCanvasPlantId &&
        !removedIds.has(state.selectedCanvasPlantId)
          ? state.selectedCanvasPlantId
          : null;
      return {
        zones: state.zones.filter((z) => z.id !== id),
        canvasPlants,
        activeZoneId: state.activeZoneId === id ? null : state.activeZoneId,
        selectedCanvasPlantId,
        zoneGardenPlans: restPlans,
        spaceListZoneId: nextSpace,
      };
    });
  },

  setActiveZoneId: (activeZoneId) =>
    set({
      activeZoneId,
      selectedCanvasPlantId: null,
    }),

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
    if (get().zoneResizeOrigin) return;
    const s = get();
    const zone = s.zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const stamped = stampMissingPlantZoneIds(
      s.canvasPlants,
      s.zones,
      zoneId,
    );
    const plants = stamped
      .filter((p) => p.zoneId === zoneId)
      .map((p) => ({ canvasId: p.canvasId, x: p.x, y: p.y }));
    set({
      canvasPlants: stamped,
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

  beginZoneResize: (zoneId, corner) => {
    if (get().zoneDragOrigin) return;
    const s = get();
    const zone = s.zones.find((z) => z.id === zoneId);
    if (!zone || zone.shape !== "rectangle") return;
    const bounds = getZoneBounds(zone);
    if (!bounds) return;
    const stamped = stampMissingPlantZoneIds(
      s.canvasPlants,
      s.zones,
      zoneId,
    );
    const plants = stamped
      .filter((p) => p.zoneId === zoneId)
      .map((p) => ({ canvasId: p.canvasId, x: p.x, y: p.y }));
    set({
      canvasPlants: stamped,
      zoneResizeOrigin: {
        zone: structuredClone(zone),
        plants,
        corner,
        bounds,
      },
      activeZoneId: zoneId,
    });
  },

  updateZoneResize: (corner, pointerX, pointerY) => {
    const origin = get().zoneResizeOrigin;
    if (!origin || origin.corner !== corner) return;
    const resized = resizeRectangleZone(
      origin.zone,
      corner,
      pointerX,
      pointerY,
    );
    if (!resized) return;
    const newBounds = getZoneBounds(resized);
    if (!newBounds) return;
    const scaled = scalePlantsToZoneBounds(
      origin.plants,
      origin.bounds,
      newBounds,
    );
    const byId = new Map(scaled.map((p) => [p.canvasId, p]));
    const plantIds = new Set(origin.plants.map((p) => p.canvasId));
    set((s) => ({
      zones: s.zones.map((z) => (z.id === resized.id ? resized : z)),
      canvasPlants: s.canvasPlants.map((p) => {
        if (!plantIds.has(p.canvasId)) return p;
        const next = byId.get(p.canvasId);
        return next ? { ...p, x: next.x, y: next.y } : p;
      }),
    }));
  },

  endZoneResize: () => {
    if (!get().zoneResizeOrigin) return;
    get().pushHistory();
    set({ zoneResizeOrigin: null });
  },
}));
