import type Konva from "konva";
import { Circle } from "react-konva";
import {
  cornerPosition,
  resizeCornerCursor,
  type ZoneResizeCorner,
} from "../../lib/zone-resize";
import { zoneColor } from "../workspace/WorkspacePanel";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { WorkspaceZone } from "../../types/workspace";

const RESIZE_CORNERS: ZoneResizeCorner[] = ["nw", "ne", "sw", "se"];
const HANDLE_RADIUS = 7;
const HANDLE_HIT = 16;

function ZoneResizeHandle({
  zone,
  corner,
  stroke,
}: {
  zone: WorkspaceZone;
  corner: ZoneResizeCorner;
  stroke: string;
}) {
  const beginZoneResize = useDesignerStore((s) => s.beginZoneResize);
  const updateZoneResize = useDesignerStore((s) => s.updateZoneResize);
  const endZoneResize = useDesignerStore((s) => s.endZoneResize);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);

  const pos = cornerPosition(zone, corner);
  if (!pos) return null;

  const syncHandle = (node: Konva.Node) => {
    const latest = useDesignerStore
      .getState()
      .zones.find((z) => z.id === zone.id);
    if (!latest) return;
    const p = cornerPosition(latest, corner);
    if (p) node.position(p);
  };

  return (
    <Circle
      x={pos.x}
      y={pos.y}
      radius={HANDLE_RADIUS}
      fill="#1a2820"
      stroke={stroke}
      strokeWidth={2}
      hitStrokeWidth={HANDLE_HIT}
      draggable
      onMouseDown={(e) => e.cancelBubble = true}
      onTouchStart={(e) => e.cancelBubble = true}
      onDragStart={(e) => {
        e.cancelBubble = true;
        beginZoneResize(zone.id, corner);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = resizeCornerCursor(corner);
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
        updateZoneResize(corner, e.target.x(), e.target.y());
        syncHandle(e.target);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        syncHandle(e.target);
        endZoneResize();
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "";
      }}
      onMouseEnter={(e) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = resizeCornerCursor(corner);
      }}
      onMouseLeave={(e) => {
        e.cancelBubble = true;
        if (useDesignerStore.getState().zoneResizeOrigin) return;
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "";
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        setActiveZoneId(zone.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setActiveZoneId(zone.id);
      }}
    />
  );
}

export function ZoneResizeHandles({
  zones,
  activeZoneId,
  workspaceTool,
}: {
  zones: WorkspaceZone[];
  activeZoneId: string | null;
  workspaceTool: "select" | "draw-zone";
}) {
  if (workspaceTool !== "select" || !activeZoneId) return null;
  const zone = zones.find((z) => z.id === activeZoneId);
  if (!zone || zone.shape !== "rectangle") return null;
  const index = zones.findIndex((z) => z.id === activeZoneId);
  const stroke = zoneColor(Math.max(0, index));

  return (
    <>
      {RESIZE_CORNERS.map((corner) => (
        <ZoneResizeHandle
          key={corner}
          zone={zone}
          corner={corner}
          stroke={stroke}
        />
      ))}
    </>
  );
}
