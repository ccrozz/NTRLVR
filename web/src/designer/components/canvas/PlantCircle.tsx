import { useEffect, useRef, useState } from "react";
import {
  Group,
  Circle,
  Ellipse,
  Text,
  Rect,
  Line,
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
  isCanvasTreeHost,
  plantCenterDotPx,
  plantHitRadiusPx,
} from "../../lib/canvas-plant-hit";
import {
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
  understoryFocus?: boolean;
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
  understoryFocus = false,
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
  const isTreeHost = isCanvasTreeHost({
    canopy_layer,
    canvas_radius_feet,
    category,
  });
  const isOverstory = canopy_layer === "Overstory";
  const ringStrength =
    compactVisuals && !active
      ? isTreeHost
        ? 0.4
        : 0.42
      : active
        ? 1
        : isOverstory
          ? 0.52
          : 0.62;
  const showCanopyRing = isTreeHost || !compactVisuals || active;
  const showNameLabel = Boolean(labelLayout?.show);
  const spreadFeet = Math.max(2, Math.round(canvas_radius_feet * 2));
  const showSpreadLabel = showCanopyRing && (isTreeHost || active);
  const isVine = canopy_layer === "Vine";
  const dotRatio = CENTER_DOT_RATIO[canopy_layer];
  const dotR = plantCenterDotPx(canvas_radius_feet, canopy_layer);
  const largeCanopyMuted =
    understoryFocus && isTreeHost && !active;
  const groupOpacity = layerDimmed ? 0.1 : largeCanopyMuted ? 0.38 : 1;
  const hitR = plantHitRadiusPx(
    { canvas_radius_feet, canopy_layer, category },
    { active, compactVisuals, understoryFocus },
  );
  const interactionDisabled = hitR <= 0;
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

  const labelBoxX =
    labelLayout && showNameLabel
      ? labelLayout.align === "center"
        ? labelLayout.offsetX - labelLayout.width / 2
        : labelLayout.align === "left"
          ? labelLayout.offsetX
          : labelLayout.offsetX - labelLayout.width
      : 0;
  const labelBoxY = labelLayout?.offsetY ?? 0;
  const centeredLabel = labelLayout?.placement === "center";
  const showLeader =
    Boolean(labelLayout?.show) &&
    !centeredLabel &&
    Math.hypot(labelLayout!.leaderAnchorX, labelLayout!.leaderAnchorY) >
      Math.max(dotR, 10) + 6;

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
          strokeWidth={active ? 2.5 : 2}
          dash={[8, 6]}
          opacity={ringStrength}
          fill={hexToRgba(colors.fill, 0.1 * ringStrength + 0.06)}
          listening={false}
        />
      ) : showCanopyRing ? (
        <>
          <Circle
            radius={r}
            stroke={strokeColor}
            strokeWidth={active ? 2.75 : 2}
            dash={[10, 7]}
            opacity={ringStrength}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndRadius={r}
            fillRadialGradientColorStops={[
              0,
              hexToRgba(colors.fill, 0.08 * ringStrength + 0.1),
              0.55,
              hexToRgba(colors.fill, 0.18 * ringStrength + 0.08),
              1,
              hexToRgba(colors.fill, 0.03),
            ]}
            listening={false}
          />
          <Circle
            radius={Math.max(dotR + 2, r * 0.14)}
            stroke={hexToRgba(colors.stroke, 0.35 * ringStrength + 0.2)}
            strokeWidth={1}
            dash={[4, 5]}
            listening={false}
          />
          {dotRatio > 0 && (
            <Circle
              radius={dotR}
              fill={hexToRgba(colors.fill, active ? 0.62 : showNameLabel && centeredLabel ? 0.2 : 0.48)}
              stroke={hexToRgba(colors.stroke, showNameLabel && centeredLabel ? 0.35 : 0.85)}
              strokeWidth={2}
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

      {!interactionDisabled && (
        <Circle
          radius={hitR}
          fill="transparent"
          hitStrokeWidth={hitPadding}
          {...pointerHandlers}
        />
      )}

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

      {!photoImg && dotRatio > 0 && illusImg && !(showNameLabel && centeredLabel) && (
        <KonvaImage
          image={illusImg}
          x={-dotR}
          y={-dotR}
          width={dotR * 2}
          height={dotR * 2}
          listening={false}
        />
      )}

      {!photoImg && dotRatio > 0 && !illusImg && !(showNameLabel && centeredLabel) && (
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

      {showSpreadLabel && showCanopyRing && (
        <Text
          y={isVine ? r * 0.55 + 2 : r + 2}
          text={`${spreadFeet}′ spread`}
          fontSize={isTreeHost ? 10 : active ? 10 : 9}
          fontStyle={isTreeHost || active ? "bold" : "normal"}
          fill={hexToRgba(
            active ? "#e8f5dc" : isTreeHost ? "#d4e8c8" : colors.stroke,
            active ? 0.95 : isTreeHost ? 0.88 : 0.72,
          )}
          align="center"
          width={Math.max(r * 2, 48)}
          offsetX={Math.max(r, 24)}
          listening={false}
        />
      )}

      {showNameLabel && labelLayout && showLeader && (
        <Line
          points={[0, 0, labelLayout.leaderAnchorX, labelLayout.leaderAnchorY]}
          stroke={hexToRgba(active ? "#b8f070" : colors.stroke, active ? 0.75 : 0.45)}
          strokeWidth={active ? 1.5 : 1}
          dash={[4, 4]}
          listening={false}
        />
      )}

      {showNameLabel && labelLayout && (
        <Group listening={false}>
          {centeredLabel && (
            <Circle
              radius={Math.max(dotR + 4, labelLayout.width / 2 + 6, labelLayout.height / 2 + 4)}
              fill="rgba(6, 16, 10, 0.88)"
              stroke={hexToRgba(active ? "#7ec850" : colors.stroke, active ? 0.85 : 0.55)}
              strokeWidth={active ? 2 : 1.5}
              listening={false}
            />
          )}
          <Rect
            x={labelBoxX}
            y={labelBoxY}
            width={labelLayout.width}
            height={labelLayout.height}
            fill={
              centeredLabel
                ? active
                  ? "rgba(8, 22, 14, 0.96)"
                  : "rgba(6, 18, 11, 0.94)"
                : active
                  ? "rgba(10, 24, 16, 0.94)"
                  : "rgba(8, 20, 14, 0.9)"
            }
            stroke={
              centeredLabel
                ? active
                  ? "rgba(184, 240, 112, 0.9)"
                  : "rgba(126, 200, 80, 0.65)"
                : active
                  ? "rgba(126, 200, 80, 0.72)"
                  : hexToRgba(colors.stroke, 0.42)
            }
            strokeWidth={centeredLabel ? (active ? 2 : 1.5) : active ? 1.5 : 1.1}
            cornerRadius={centeredLabel ? 8 : 6}
            shadowColor="rgba(0, 0, 0, 0.55)"
            shadowBlur={centeredLabel ? 10 : 6}
            shadowOffsetY={2}
            shadowOpacity={0.85}
          />
          <Text
            x={labelBoxX + 7}
            y={labelBoxY + (centeredLabel ? 4 : 5)}
            text={labelLayout.text}
            fontSize={labelLayout.fontSize}
            fontStyle={centeredLabel || active ? "bold" : "normal"}
            fill={active ? "#f8fff4" : "#f0f8ec"}
            width={labelLayout.width - 14}
            align={centeredLabel ? "center" : "left"}
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
