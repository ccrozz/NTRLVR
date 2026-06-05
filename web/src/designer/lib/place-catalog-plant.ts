import { fetchPlant } from "../../api";
import type { Plant } from "../../types";
import type { PlantListItem } from "../types";
import { focusDesignerCanvas } from "./focus-designer-canvas";
import { zoneLayoutBoundsPx } from "./zone-geometry";
import { useDesignerStore } from "../store/useDesignerStore";

function plantToListItem(plant: Plant): PlantListItem {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    is_florida_native: plant.is_florida_native,
    is_kitchen_essential: plant.is_kitchen_essential,
    is_edible: plant.is_edible,
    native_states: plant.native_states,
    native_origin: plant.native_origin,
    growing_zones: plant.growing_zones,
    is_invasive_in_florida: plant.is_invasive_in_florida,
    canvas_radius_feet: plant.canvas_radius_feet,
    image_url: plant.image_url,
    tags: plant.tags,
    data_source: plant.data_source,
    mature_height_feet: plant.mature_height_feet,
    source: plant.source,
    trefle_id: plant.trefle_id,
    trefle_slug: plant.trefle_slug,
  };
}

function placementPointForCanvas(): { x: number; y: number } {
  const { zones, activeZoneId } = useDesignerStore.getState();
  const zone =
    zones.find((z) => z.id === activeZoneId) ?? zones[0] ?? null;
  if (!zone) return { x: 200, y: 200 };

  const bounds = zoneLayoutBoundsPx(zone);
  return {
    x: (bounds.x0 + bounds.x1) / 2,
    y: (bounds.y0 + bounds.y1) / 2,
  };
}

/** Fetch a catalog plant and place it on the designer canvas (from ?plant= URL). */
export async function placeCatalogPlantInDesigner(plantId: string): Promise<void> {
  const store = useDesignerStore.getState();
  const existing = store.canvasPlants.find((p) => p.plantId === plantId);
  if (existing) {
    store.openCanvasPlantProfile(existing.canvasId);
    store.requestCanvasFit();
    store.setMobileSidebarOpen(false);
    store.setMobileToolsOpen(false);
    focusDesignerCanvas();
    return;
  }

  const { data: plant } = await fetchPlant(plantId);
  const item = plantToListItem(plant);
  const { x, y } = placementPointForCanvas();

  store.setSidebarMode("browse");
  store.addPlant(item, x, y);

  const added = useDesignerStore.getState().canvasPlants.at(-1);
  if (added?.plantId === plantId) {
    store.openCanvasPlantProfile(added.canvasId);
  }

  store.requestCanvasFit();
  store.setMobileSidebarOpen(false);
  store.setMobileToolsOpen(false);
  focusDesignerCanvas();
}
