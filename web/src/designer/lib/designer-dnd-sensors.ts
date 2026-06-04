import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

/** Desktop: small movement starts drag. Mobile: short hold avoids fighting list scroll. */
export function useDesignerDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );
}
