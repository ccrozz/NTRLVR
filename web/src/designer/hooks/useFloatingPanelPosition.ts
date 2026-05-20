import { useCallback, useEffect, useRef, useState } from "react";

export type PanelPosition = { x: number; y: number };

function loadPosition(key: string, fallback: PanelPosition): PanelPosition {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as PanelPosition;
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function centeredPanelPosition(
  boundsEl: HTMLElement | null,
  panelEl: HTMLElement | null,
  pad = 12,
): PanelPosition | null {
  if (!panelEl || !boundsEl || panelEl.offsetWidth === 0) return null;
  return {
    x: Math.max(pad, (boundsEl.clientWidth - panelEl.offsetWidth) / 2),
    y: Math.max(pad, (boundsEl.clientHeight - panelEl.offsetHeight) / 2),
  };
}

export function clampPanelPosition(
  pos: PanelPosition,
  panelEl: HTMLElement | null,
  boundsEl: HTMLElement | null,
): PanelPosition {
  if (!panelEl || !boundsEl) return pos;
  const pad = 8;
  const bw = boundsEl.clientWidth;
  const bh = boundsEl.clientHeight;
  const pw = panelEl.offsetWidth;
  const ph = panelEl.offsetHeight;
  return {
    x: Math.min(Math.max(pad, pos.x), Math.max(pad, bw - pw - pad)),
    y: Math.min(Math.max(pad, pos.y), Math.max(pad, bh - ph - pad)),
  };
}

export function useFloatingPanelPosition(
  storageKey: string,
  defaultPosition: PanelPosition,
  boundsRef: React.RefObject<HTMLElement | null>,
) {
  const panelRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [position, setPosition] = useState(() =>
    loadPosition(storageKey, defaultPosition),
  );

  const persist = useCallback(
    (pos: PanelPosition) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(pos));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  useEffect(() => {
    const el = panelRef.current;
    const bounds = boundsRef.current;
    if (!el || !bounds) return;
    const clamped = clampPanelPosition(position, el, bounds);
    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped);
      persist(clamped);
    }
  }, [position, boundsRef, persist]);

  useEffect(() => {
    const onResize = () => {
      const el = panelRef.current;
      const bounds = boundsRef.current;
      if (!el || !bounds) return;
      setPosition((p) => {
        const next = clampPanelPosition(p, el, bounds);
        persist(next);
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [boundsRef, persist]);

  function onDragHandlePointerDown(e: React.PointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onDragHandlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = {
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    };
    setPosition(clampPanelPosition(next, panelRef.current, boundsRef.current));
  }

  function onDragHandlePointerUp(e: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setPosition((p) => {
      const next = clampPanelPosition(p, panelRef.current, boundsRef.current);
      persist(next);
      return next;
    });
  }

  return {
    panelRef,
    position,
    setPosition,
    dragHandleProps: {
      onPointerDown: onDragHandlePointerDown,
      onPointerMove: onDragHandlePointerMove,
      onPointerUp: onDragHandlePointerUp,
      onPointerCancel: onDragHandlePointerUp,
    },
  };
}
