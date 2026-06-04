import type Konva from "konva";

/** True when a screen point hits a draggable canvas plant (not empty bed). */
export function pointerHitsCanvasPlant(
  stage: Konva.Stage,
  root: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = root.getBoundingClientRect();
  const shape = stage.getIntersection({
    x: clientX - rect.left,
    y: clientY - rect.top,
  });
  if (!shape) return false;

  let node: Konva.Node | null = shape;
  while (node && node !== stage) {
    if (node.getAttr("canvasPlant") === true) return true;
    node = node.parent;
  }
  return false;
}
