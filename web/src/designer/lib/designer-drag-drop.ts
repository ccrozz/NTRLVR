import type { Active, DragEndEvent } from "@dnd-kit/core";
import type { PlantListItem } from "../types";

const SUPPRESS_SIDEBAR_CLICK_MS = 450;
let suppressSidebarPlantClickUntil = 0;

/** Ignore row taps fired right after a drag-drop (touch/mouse ghost click). */
export function markPlantDragJustEnded(): void {
  suppressSidebarPlantClickUntil = Date.now() + SUPPRESS_SIDEBAR_CLICK_MS;
}

export function shouldIgnoreSidebarPlantClick(): boolean {
  return Date.now() < suppressSidebarPlantClickUntil;
}

export function plantFromActive(active: Active): PlantListItem | undefined {
  return active.data.current?.plant as PlantListItem | undefined;
}

export function plantFromDragEvent(
  event: DragEndEvent,
): PlantListItem | undefined {
  return plantFromActive(event.active);
}

/** Screen coordinates for drop onto the canvas (works with touch + pointer). */
export function dragDropClientPoint(event: DragEndEvent): {
  x: number;
  y: number;
} | null {
  const translated = event.active.rect.current.translated;
  if (translated) {
    return {
      x: translated.left + translated.width / 2,
      y: translated.top + translated.height / 2,
    };
  }

  const { activatorEvent, delta } = event;
  if (activatorEvent && "clientX" in activatorEvent) {
    const ev = activatorEvent as PointerEvent;
    return {
      x: ev.clientX + (delta.x ?? 0),
      y: ev.clientY + (delta.y ?? 0),
    };
  }

  return null;
}

export function isDropOverCanvas(
  event: DragEndEvent,
  canvasEl: Element | null | undefined,
): boolean {
  if (event.over?.id === "canvas") return true;
  if (!canvasEl) return false;
  const drop = dragDropClientPoint(event);
  if (!drop) return false;
  const rect = canvasEl.getBoundingClientRect();
  return (
    drop.x >= rect.left &&
    drop.x <= rect.right &&
    drop.y >= rect.top &&
    drop.y <= rect.bottom
  );
}
