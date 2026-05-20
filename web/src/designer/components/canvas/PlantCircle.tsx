import { useEffect, useState } from "react";
import {
  Group,
  Circle,
  Ellipse,
  Text,
  Image as KonvaImage,
  Path,
} from "react-konva";
import type Konva from "konva";
import type { CanopyLayer, PlantCategory } from "../../../types";
import {
  canopyColor,
  CENTER_DOT_RATIO,
  hexToRgba,
} from "../../lib/canopy-colors";
import { radiusPx } from "../../lib/canvas-utils";
import {
  getCategoryIllustration,
  loadCategoryIllustrationImage,
} from "../../lib/plant-illustrations";
export type PlantCircleProps = {
  canvasId: string;
  plantId: string;
  x: number;
  y: number;
  canvas_radius_feet: number;
  image_url: string | null;
  common_name: string;
  category: PlantCategory;
  canopy_layer: CanopyLayer;
  is_invasive_in_florida: boolean;
  selected: boolean;
  hovered: boolean;
  outsideZone: boolean;
  layerDimmed: boolean;
  placementFlash?: boolean;
  compactVisuals?: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onHover: (hovering: boolean) => void;
};

const UNDERSTORY_LAYERS: CanopyLayer[] = ["Overstory", "Understory"];

export function PlantCircle({
  x,
  y,
  canvas_radius_feet,
  image_url,
  common_name,
  category,
  canopy_layer,
  is_invasive_in_florida,
  selected,
  hovered,
  outsideZone,
  layerDimmed,
  placementFlash = false,
  compactVisuals = false,
  onSelect,
  onDragEnd,
  onHover,
}: PlantCircleProps) {
  const colors = canopyColor(canopy_layer);
  const r = radiusPx(canvas_radius_feet, 1);
  const active = selected || hovered;
  const showCanopyRing = !compactVisuals || active || placementFlash;
  const showNameLabel = !compactVisuals || active;
  const isVine = canopy_layer === "Vine";
  const dotRatio = CENTER_DOT_RATIO[canopy_layer];
  const dotR = Math.max(4, r * dotRatio);
  const groupOpacity = layerDimmed ? 0.1 : 1;

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [illusImg, setIllusImg] = useState<HTMLImageElement | null>(null);
  const [flashOpacity, setFlashOpacity] = useState(0);

  useEffect(() => {
    if (!placementFlash) {
      setFlashOpacity(0);
      return;
    }
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      setFlashOpacity(frame % 2 === 0 ? 0.95 : 0.25);
      if (frame >= 10) window.clearInterval(id);
    }, 140);
    return () => window.clearInterval(id);
  }, [placementFlash]);

  useEffect(() => {
    if (!image_url) {
      setPhotoImg(null);
      return;
    }
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setPhotoImg(el);
    el.onerror = () => setPhotoImg(null);
    el.src = image_url;
  }, [image_url]);

  useEffect(() => {
    if (photoImg) {
      setIllusImg(null);
      return;
    }
    let cancelled = false;
    loadCategoryIllustrationImage(
      category,
      colors.stroke,
      Math.round(dotR * 2.2),
    ).then((img) => {
      if (!cancelled) setIllusImg(img);
    });
    return () => {
      cancelled = true;
    };
  }, [photoImg, category, colors.stroke, dotR]);

  const hitPadding = Math.max(6, 22 - r);
  const strokeColor = active
    ? "#7ec850"
    : outsideZone
      ? "#e8a040"
      : hexToRgba(colors.stroke, 0.8);

  const showUnderstoryZone =
    selected && UNDERSTORY_LAYERS.includes(canopy_layer);
  const understoryR = r * 0.4;

  const ill = getCategoryIllustration(category);
  const illScale = dotR / (ill.viewSize / 2);

  const cursorHandlers = {
    onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "grab";
      onHover(true);
    },
    onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "";
      onHover(false);
    },
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "grabbing";
      onHover(true);
    },
  };

  return (
    <Group
      x={x}
      y={y}
      opacity={groupOpacity}
      draggable
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      {...cursorHandlers}
    >
      {placementFlash && flashOpacity > 0 && (
        <Circle
          radius={r + 10}
          stroke="#b8f070"
          strokeWidth={4}
          opacity={flashOpacity}
          listening={false}
        />
      )}

      {showUnderstoryZone && (
        <>
          <Circle
            radius={understoryR}
            fill={hexToRgba("#7ec850", 0.2)}
            stroke="#7ec850"
            strokeWidth={2}
            dash={[6, 5]}
            listening={false}
          />
          <Text
            y={understoryR + 6}
            text="Understory zone — plant shrubs & herbs here"
            fontSize={10}
            fill="#a8d878"
            align="center"
            width={understoryR * 4}
            offsetX={understoryR * 2}
            listening={false}
          />
        </>
      )}

      {isVine ? (
        <Ellipse
          radiusX={r}
          radiusY={r * 0.55}
          stroke={strokeColor}
          strokeWidth={2}
          dash={[8, 6]}
          fill={hexToRgba(colors.fill, 0.12)}
          hitStrokeWidth={hitPadding}
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onSelect();
          }}
        />
      ) : showCanopyRing ? (
        <>
          <Circle
            radius={r}
            stroke={strokeColor}
            strokeWidth={active ? 2 : 1.5}
            dash={[8, 6]}
            opacity={active ? 1 : 0.28}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndRadius={r}
            fillRadialGradientColorStops={[
              0,
              hexToRgba(colors.fill, active ? 0.3 : 0.12),
              1,
              hexToRgba(colors.fill, 0),
            ]}
            hitStrokeWidth={hitPadding}
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
          />
          {dotRatio > 0 && (
            <Circle
              radius={dotR}
              fill={hexToRgba(colors.fill, active ? 0.55 : 0.4)}
              stroke={hexToRgba(colors.stroke, 0.7)}
              strokeWidth={1.5}
              listening={false}
            />
          )}
        </>
      ) : (
        <>
          <Circle
            radius={Math.max(r, dotR + 10)}
            fill="transparent"
            hitStrokeWidth={hitPadding}
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
          />
          {dotRatio > 0 && (
            <Circle
              radius={dotR}
              fill={hexToRgba(colors.fill, active ? 0.55 : 0.42)}
              stroke={hexToRgba(colors.stroke, 0.75)}
              strokeWidth={1.5}
              listening={false}
            />
          )}
        </>
      )}

      {photoImg && dotRatio > 0 && (
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.arc(0, 0, dotR, 0, Math.PI * 2);
            ctx.closePath();
          }}
          listening={false}
        >
          <KonvaImage
            image={photoImg}
            x={-dotR}
            y={-dotR}
            width={dotR * 2}
            height={dotR * 2}
            opacity={active ? 1 : 0.92}
          />
        </Group>
      )}

      {!photoImg && dotRatio > 0 && illusImg && (
        <KonvaImage
          image={illusImg}
          x={-dotR}
          y={-dotR}
          width={dotR * 2}
          height={dotR * 2}
          listening={false}
        />
      )}

      {!photoImg && dotRatio > 0 && !illusImg && (
        <Group scale={{ x: illScale, y: illScale }} listening={false}>
          {ill.paths.map((d, i) => (
            <Path
              key={i}
              data={d}
              stroke={colors.stroke}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              offsetX={ill.viewSize / 2}
              offsetY={ill.viewSize / 2}
            />
          ))}
        </Group>
      )}

      {showNameLabel && (
        <Text
          y={r + 10}
          text={common_name}
          fontSize={hovered ? 12 : 10}
          fontStyle={active ? "bold" : "normal"}
          fill={active ? "#f4fff0" : "#d8e6d6"}
          align="center"
          width={Math.max(72, r * 2.2)}
          offsetX={Math.max(36, r * 1.1)}
          listening={false}
        />
      )}

      {outsideZone && (
        <Text
          x={r - 10}
          y={-r + 2}
          text="⚠️"
          fontSize={14}
          listening={false}
        />
      )}
      {is_invasive_in_florida && !outsideZone && (
        <Text
          x={r - 10}
          y={-r + 2}
          text="⚠️"
          fontSize={14}
          listening={false}
        />
      )}
    </Group>
  );
}
