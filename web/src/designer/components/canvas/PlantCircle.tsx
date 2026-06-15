import { useEffect, useRef, useState } from "react";
import {
  Group,
  Circle,
  Ellipse,
  Text,
  Rect,
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
import { createCanvasPlantTapHandlers } from "../../lib/canvas-plant-tap";
import {
  CANVAS_MAX_CENTER_DOT_PX,
  CANVAS_USE_PLANT_PHOTOS,
  radiusPx,
} from "../../lib/canvas-utils";
import {
  getCategoryIllustration,
  loadCategoryIllustrationImage,
} from "../../lib/plant-illustrations";
import type { PlantLabelLayout } from "../../lib/canvas-plant-labels";

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
  labelLayout?: PlantLabelLayout;
  draggable?: boolean;
  dragDistance?: number;
  onSelect: () => void;
  onOpenProfile: () => void;
  onDragEnd: (x: number, y: number) => void;
  onHover: (hovering: boolean) => void;
};

const UNDERSTORY_LAYERS: CanopyLayer[] = ["Overstory", "Understory"];

export function PlantCircle({
  x,
  y,
  canvas_radius_feet,
  image_url,
  common_name: _commonName,
  category,
  canopy_layer,
  is_invasive_in_florida,
  selected,
  hovered,
  outsideZone,
  layerDimmed,
  placementFlash = false,
  compactVisuals = false,
  labelLayout,
  draggable = true,
  dragDistance = 3,
  onSelect,
  onOpenProfile,
  onDragEnd,
  onHover,
}: PlantCircleProps) {
  const colors = canopyColor(canopy_layer);
  const r = radiusPx(canvas_radius_feet, 1);
  const active = selected || hovered;
  const showCanopyRing =
    !compactVisuals || selected || hovered || placementFlash;
  const showNameLabel =
    labelLayout?.show ?? (!compactVisuals || active);
  const isVine = canopy_layer === "Vine";
  const dotRatio = CENTER_DOT_RATIO[canopy_layer];
  const dotR = Math.min(
    CANVAS_MAX_CENTER_DOT_PX,
    Math.max(4, r * dotRatio),
  );
  const groupOpacity = layerDimmed ? 0.1 : 1;
  const hitR = Math.max(r, dotR + 12);
  const draggedRef = useRef(false);

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [illusImg, setIllusImg] = useState<HTMLImageElement | null>(null);
  const [flashOpacity, setFlashOpacity] = useState(0);

  const tapHandlers = createCanvasPlantTapHandlers(
    onSelect,
    onOpenProfile,
    () => draggedRef.current,
  );

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
    if (!CANVAS_USE_PLANT_PHOTOS || !image_url) {
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

  const hitPadding = Math.max(8, 24 - r);
  const strokeColor = selected
    ? "#7ec850"
    : outsideZone
      ? "#e8a040"
      : hexToRgba(colors.stroke, 0.8);

  const showUnderstoryZone =
    selected && UNDERSTORY_LAYERS.includes(canopy_layer);
  const understoryR = r * 0.4;

  const ill = getCategoryIllustration(category);
  const illScale = dotR / (ill.viewSize / 2);

  const pointerHandlers = {
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      tapHandlers.onClick();
    },
    onTap: (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true;
      tapHandlers.onTap();
    },
    onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      tapHandlers.onDblClick();
    },
  };

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
      draggedRef.current = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "grabbing";
      onHover(true);
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "grab";
      onDragEnd(e.target.x(), e.target.y());
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 80);
    },
  };

  return (
    <Group
      x={x}
      y={y}
      opacity={groupOpacity}
      canvasPlant
      draggable={draggable}
      dragDistance={draggable ? dragDistance : 0}
      {...(draggable ? {} : {})}
      {...cursorHandlers}
    >
      {selected && (
        <Circle
          radius={hitR + 4}
          stroke="#7ec850"
          strokeWidth={2.5}
          dash={[6, 4]}
          opacity={0.95}
          listening={false}
        />
      )}

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
          strokeWidth={selected ? 2.5 : 2}
          dash={[8, 6]}
          fill={hexToRgba(colors.fill, 0.12)}
          listening={false}
        />
      ) : showCanopyRing ? (
        <>
          <Circle
            radius={r}
            stroke={strokeColor}
            strokeWidth={active ? 2.5 : 1.5}
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
            listening={false}
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
        dotRatio > 0 && (
          <Circle
            radius={dotR}
            fill={hexToRgba(colors.fill, active ? 0.55 : 0.42)}
            stroke={hexToRgba(colors.stroke, 0.75)}
            strokeWidth={1.5}
            listening={false}
          />
        )
      )}

      <Circle
        radius={hitR}
        fill="transparent"
        hitStrokeWidth={hitPadding}
        {...pointerHandlers}
      />

      {CANVAS_USE_PLANT_PHOTOS && photoImg && dotRatio > 0 && (
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

      {showNameLabel && labelLayout && (
        <Group listening={false}>
          <Rect
            x={
              labelLayout.align === "center"
                ? labelLayout.offsetX - labelLayout.width / 2
                : labelLayout.align === "left"
                  ? labelLayout.offsetX
                  : labelLayout.offsetX - labelLayout.width
            }
            y={labelLayout.offsetY}
            width={labelLayout.width}
            height={labelLayout.height}
            fill="rgba(8, 20, 14, 0.88)"
            stroke={active ? "rgba(126, 200, 80, 0.55)" : "rgba(197, 212, 192, 0.28)"}
            strokeWidth={active ? 1.25 : 1}
            cornerRadius={5}
            shadowColor="rgba(0, 0, 0, 0.45)"
            shadowBlur={4}
            shadowOffsetY={1}
            shadowOpacity={0.7}
          />
          <Text
            x={
              labelLayout.align === "center"
                ? labelLayout.offsetX - labelLayout.width / 2 + 6
                : labelLayout.align === "left"
                  ? labelLayout.offsetX + 6
                  : labelLayout.offsetX - labelLayout.width + 6
            }
            y={labelLayout.offsetY + 4}
            text={labelLayout.text}
            fontSize={labelLayout.fontSize}
            fontStyle={active ? "bold" : "normal"}
            fill={active ? "#f4fff0" : "#dce8dc"}
            width={labelLayout.width - 12}
            ellipsis
            listening={false}
          />
        </Group>
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
