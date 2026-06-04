/** Single-tap select vs double-tap profile for Konva canvas plants. */
export function createCanvasPlantTapHandlers(
  onSelect: () => void,
  onOpenProfile: () => void,
  isDragging: () => boolean,
) {
  let lastTapAt = 0;
  const DOUBLE_MS = 360;

  function onTap() {
    if (isDragging()) return;
    const now = Date.now();
    if (now - lastTapAt < DOUBLE_MS) {
      lastTapAt = 0;
      onOpenProfile();
      return;
    }
    lastTapAt = now;
    onSelect();
  }

  function onClick() {
    if (isDragging()) return;
    onSelect();
  }

  function onDblClick() {
    if (isDragging()) return;
    lastTapAt = 0;
    onOpenProfile();
  }

  return { onTap, onClick, onDblClick };
}
