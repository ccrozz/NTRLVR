import { useMemo } from "react";
import {
  EDGE_RULER_LEFT,
  EDGE_RULER_TOP,
} from "../../lib/canvas-ruler-insets";
import {
  horizontalRulerTicks,
  verticalRulerTicks,
} from "../../lib/edge-ruler-ticks";

export { EDGE_RULER_LEFT, EDGE_RULER_TOP };

type Props = {
  viewportW: number;
  viewportH: number;
  stagePos: { x: number; y: number };
  zoom: number;
  visible: boolean;
};

/** Top/left foot rulers pinned to the viewport; tick values update while panning. */
export function CanvasEdgeRulers({
  viewportW,
  viewportH,
  stagePos,
  zoom,
  visible,
}: Props) {
  const hTicks = useMemo(
    () =>
      horizontalRulerTicks(viewportW, stagePos.x, zoom, EDGE_RULER_LEFT),
    [viewportW, stagePos.x, zoom],
  );
  const vTicks = useMemo(
    () =>
      verticalRulerTicks(viewportH, stagePos.y, zoom, EDGE_RULER_TOP),
    [viewportH, stagePos.y, zoom],
  );

  if (!visible) return null;

  return (
    <div className="designer-edge-rulers" aria-hidden>
      <div
        className="designer-edge-ruler-corner"
        style={{ width: EDGE_RULER_LEFT, height: EDGE_RULER_TOP }}
      />
      <div
        className="designer-edge-ruler designer-edge-ruler--top"
        style={{ left: EDGE_RULER_LEFT, height: EDGE_RULER_TOP }}
      >
        {hTicks.map((t) => (
          <div
            key={`h-${t.feet}`}
            className={`designer-edge-ruler-tick${t.major ? " is-major" : ""}`}
            style={{ left: t.screen - EDGE_RULER_LEFT }}
          >
            {t.major && (
              <span className="designer-edge-ruler-label">{t.feet}′</span>
            )}
          </div>
        ))}
      </div>
      <div
        className="designer-edge-ruler designer-edge-ruler--left"
        style={{ top: EDGE_RULER_TOP, width: EDGE_RULER_LEFT }}
      >
        {vTicks.map((t) => (
          <div
            key={`v-${t.feet}`}
            className={`designer-edge-ruler-tick${t.major ? " is-major" : ""}`}
            style={{ top: t.screen - EDGE_RULER_TOP }}
          >
            {t.major && (
              <span className="designer-edge-ruler-label">{t.feet}′</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
