import type Konva from "konva";
import { Circle, Line, Rect, Text } from "react-konva";
import { feetToPx } from "../../lib/zone-geometry";
import { zoneColor } from "../workspace/WorkspacePanel";
import { useDesignerStore } from "../../store/useDesignerStore";
import type { WorkspaceZone } from "../../types/workspace";

function zoneStroke(index: number, active: boolean): string {
  const c = zoneColor(index);
  return active ? c : `${c}99`;
}

function dragDelta(zone: WorkspaceZone, node: Konva.Node): { dx: number; dy: number } {
  const origin = useDesignerStore.getState().zoneDragOrigin?.zone;
  if (!origin || origin.id !== zone.id) return { dx: 0, dy: 0 };

  if (zone.shape === "rectangle") {
    return {
      dx: node.x() - (origin.x ?? 0),
      dy: node.y() - (origin.y ?? 0),
    };
  }
  if (zone.shape === "circle") {
    return {
      dx: node.x() - (origin.cx ?? 0),
      dy: node.y() - (origin.cy ?? 0),
    };
  }
  return { dx: node.x(), dy: node.y() };
}

function DraggableZone({
  zone,
  index,
  active,
  draggable,
}: {
  zone: WorkspaceZone;
  index: number;
  active: boolean;
  draggable: boolean;
}) {
  const beginZoneDrag = useDesignerStore((s) => s.beginZoneDrag);
  const updateZoneDrag = useDesignerStore((s) => s.updateZoneDrag);
  const endZoneDrag = useDesignerStore((s) => s.endZoneDrag);
  const setActiveZoneId = useDesignerStore((s) => s.setActiveZoneId);

  const stroke = zoneStroke(index, active);
  const fill = `${zoneColor(index)}22`;

  const dragHandlers = {
    draggable,
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      beginZoneDrag(zone.id);
    },
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const { dx, dy } = dragDelta(zone, e.target);
      updateZoneDrag(dx, dy);
      if (zone.shape === "polygon") {
        e.target.position({ x: 0, y: 0 });
      }
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      if (zone.shape === "polygon") {
        e.target.position({ x: 0, y: 0 });
      }
      endZoneDrag();
    },
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      setActiveZoneId(zone.id);
    },
    onTap: (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true;
      setActiveZoneId(zone.id);
    },
  };

  if (zone.shape === "rectangle") {
    const w = feetToPx(zone.widthFeet ?? 0);
    const h = feetToPx(zone.heightFeet ?? 0);
    return (
      <Rect
        key={zone.id}
        x={zone.x ?? 0}
        y={zone.y ?? 0}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.5 : 1.5}
        dash={active ? undefined : [8, 6]}
        opacity={draggable ? 1 : 0.95}
        {...dragHandlers}
      />
    );
  }

  if (zone.shape === "circle") {
    const r = feetToPx(zone.radiusFeet ?? 0);
    return (
      <Circle
        key={zone.id}
        x={zone.cx ?? 0}
        y={zone.cy ?? 0}
        radius={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.5 : 1.5}
        dash={active ? undefined : [8, 6]}
        {...dragHandlers}
      />
    );
  }

  if (zone.shape === "polygon" && zone.points?.length) {
    const flat = zone.points.flatMap((p) => [p.x, p.y]);
    return (
      <Line
        key={zone.id}
        points={flat}
        closed
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.5 : 1.5}
        dash={active ? undefined : [8, 6]}
        hitStrokeWidth={12}
        {...dragHandlers}
      />
    );
  }

  return null;
}

export function ZoneLayer({
  zones,
  activeZoneId,
  drawPoints,
  workspaceTool,
}: {
  zones: WorkspaceZone[];
  activeZoneId: string | null;
  drawPoints: { x: number; y: number }[];
  workspaceTool: "select" | "draw-zone";
}) {
  const zoneDraggable = workspaceTool === "select";

  return (
    <>
      {zones.map((zone, i) => (
        <DraggableZone
          key={zone.id}
          zone={zone}
          index={i}
          active={zone.id === activeZoneId}
          draggable={zoneDraggable}
        />
      ))}

      {zoneDraggable && zones.length > 0 && (
        <Text
          x={12}
          y={28}
          text="Drag moves this bed and its plants only"
          fontSize={10}
          fill="rgba(168, 196, 168, 0.7)"
          listening={false}
        />
      )}

      {drawPoints.length > 0 && (
        <>
          <Line
            points={drawPoints.flatMap((p) => [p.x, p.y])}
            stroke="#7ec850"
            strokeWidth={2}
            dash={[6, 4]}
            listening={false}
          />
          {drawPoints.length >= 3 && (
            <Line
              points={[
                drawPoints[drawPoints.length - 1]!.x,
                drawPoints[drawPoints.length - 1]!.y,
                drawPoints[0]!.x,
                drawPoints[0]!.y,
              ]}
              stroke="#7ec850"
              strokeWidth={1.5}
              dash={[4, 6]}
              opacity={0.55}
              listening={false}
            />
          )}
          {drawPoints.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={5}
              fill="#7ec850"
              stroke="#1a2820"
              strokeWidth={1}
              listening={false}
            />
          ))}
        </>
      )}

      {drawPoints.length > 0 && (
        <Text
          x={drawPoints[0]!.x}
          y={drawPoints[0]!.y - 20}
          text={
            drawPoints.length >= 3
              ? "Click first point or Finish below"
              : "Click corners on the grid"
          }
          fontSize={11}
          fill="#a8c4a8"
          listening={false}
        />
      )}
    </>
  );
}
