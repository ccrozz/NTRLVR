import { useMemo, useState } from "react";
import { Group, Circle, Text } from "react-konva";
import type Konva from "konva";
import { useQuery } from "@tanstack/react-query";
import { useDesignerStore } from "../../store/useDesignerStore";
import { usePlantDetail } from "../../hooks/useTreflePlant";
import { canopyColor, hexToRgba } from "../../lib/canopy-colors";
import {
  companionRingPx,
  companionSlotPosition,
  isCompanionPlacedNearHost,
} from "../../lib/companion-placement";
import { radiusPx } from "../../lib/canvas-utils";
import type { PlantSummary } from "../../../types";

const API = import.meta.env.VITE_API_URL ?? "";

async function fetchCompanions(names: string[]): Promise<PlantSummary[]> {
  if (!names.length) return [];
  const params = new URLSearchParams({
    names: names.join(","),
    food_forest_only: "true",
    limit: String(names.length),
  });
  const res = await fetch(`${API}/api/plants?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as PlantSummary[];
}

type Props = {
  hostCanvasId: string;
  hostX: number;
  hostY: number;
  hostRadiusFeet: number;
  plantId: string;
};

export function CompanionSuggestions({
  hostCanvasId,
  hostX,
  hostY,
  hostRadiusFeet,
  plantId,
}: Props) {
  const addPlantNearHost = useDesignerStore((s) => s.addPlantNearHost);
  const canvasPlants = useDesignerStore((s) => s.canvasPlants);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const { data: plant } = usePlantDetail(plantId);
  const companionNames = plant?.companion_plants ?? [];

  const { data: companions = [] } = useQuery({
    queryKey: ["companions", plantId, companionNames.join("|")],
    enabled: companionNames.length > 0,
    queryFn: () => fetchCompanions(companionNames),
  });

  const host = useMemo(
    () => ({
      canvasId: hostCanvasId,
      x: hostX,
      y: hostY,
      canvas_radius_feet: hostRadiusFeet,
    }),
    [hostCanvasId, hostX, hostY, hostRadiusFeet],
  );

  const positions = useMemo(() => {
    const n = companions.length;
    if (!n) return [];
    return companions
      .map((cp, i) => ({
        plant: cp,
        slotIndex: i,
        ...companionSlotPosition(host, i, n),
      }))
      .filter(
        (slot) =>
          !isCompanionPlacedNearHost(host, slot.plant.id, canvasPlants),
      );
  }, [companions, host, canvasPlants]);

  if (!positions.length) return null;

  const hostR = radiusPx(hostRadiusFeet, 1);
  const ring = companionRingPx(hostRadiusFeet);

  return (
    <Group listening>
      <Circle
        x={hostX}
        y={hostY}
        radius={ring}
        stroke={hexToRgba("#7cb87a", 0.35)}
        strokeWidth={1}
        dash={[8, 6]}
        listening={false}
      />
      {positions.map(({ plant: cp, x, y, slotIndex }, i) => {
        const r = Math.max(14, radiusPx(cp.canvas_radius_feet, 1) * 0.55);
        const colors = canopyColor(cp.canopy_layer);
        const hovered = hoveredIdx === i;
        const totalSlots = companions.length;

        return (
          <Group
            key={`${cp.id}-${slotIndex}`}
            x={x}
            y={y}
            onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              setHoveredIdx(i);
              setTooltip(
                `${cp.common_name} — tap + to add in this spot`,
              );
            }}
            onMouseLeave={() => {
              setHoveredIdx(null);
              setTooltip(null);
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              addPlantNearHost(hostCanvasId, cp, slotIndex, totalSlots);
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              addPlantNearHost(hostCanvasId, cp, slotIndex, totalSlots);
            }}
          >
            <Circle
              radius={r}
              stroke={colors.stroke}
              strokeWidth={2}
              dash={[6, 4]}
              fill="transparent"
              opacity={hovered ? 0.85 : 0.5}
            />
            <Text
              text="+"
              fontSize={Math.min(18, r)}
              fill={colors.stroke}
              align="center"
              verticalAlign="middle"
              offsetX={r * 0.2}
              offsetY={r * 0.35}
              opacity={hovered ? 1 : 0.7}
              listening={false}
            />
            <Text
              y={r + 6}
              text={cp.common_name}
              fontSize={10}
              fill={hexToRgba(colors.stroke, hovered ? 1 : 0.75)}
              align="center"
              width={r * 3}
              offsetX={(r * 3) / 2}
              listening={false}
            />
          </Group>
        );
      })}
      {tooltip && hoveredIdx !== null && positions[hoveredIdx] && (
        <Text
          x={positions[hoveredIdx].x}
          y={positions[hoveredIdx].y - hostR * 0.35}
          text={tooltip}
          fontSize={11}
          fill="#e8f0e9"
          align="center"
          width={200}
          offsetX={100}
          listening={false}
        />
      )}
    </Group>
  );
}
