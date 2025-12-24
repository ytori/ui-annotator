import type Konva from "konva";
import { memo, useCallback } from "react";
import { Group, Rect, Text } from "react-konva";
import {
  type EditorElement,
  type ElementColor,
  type ElementId,
  getDisplayLabel,
} from "@/types";
import { labelConfig } from "../../constants/canvas";
import { colorToRgb, colorToRgba, getElementRgb } from "../../constants/colors";

export function getElementStroke(color?: ElementColor): string {
  return colorToRgb(getElementRgb(color));
}

export function getElementFill(
  color: ElementColor | undefined,
  selected: boolean,
  hovered: boolean
): string {
  let alpha = 0.05;
  if (selected) {
    alpha = 0.15;
  } else if (hovered) {
    alpha = 0.1;
  }
  return colorToRgba(getElementRgb(color), alpha);
}

// Calculate label width accounting for full-width characters (Japanese, etc.)
export function getLabelWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    const isFullWidth =
      (code >= 0x30_00 && code <= 0x9f_ff) || // CJK
      (code >= 0xff_00 && code <= 0xff_ef) || // Full-width forms
      (code >= 0xac_00 && code <= 0xd7_af); // Korean
    width += isFullWidth ? fontSize : fontSize * 0.6;
  }
  return width;
}

interface AnnotationElementProps {
  element: EditorElement;
  isSelected: boolean;
  isHovered: boolean;
  stageScale: number;
  onTransform: (e: Konva.KonvaEventObject<Event>, id: ElementId) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>, id: ElementId) => void;
  onHover: (id: ElementId | null) => void;
}

export const AnnotationElement = memo(function AnnotationElement({
  element,
  isSelected,
  isHovered,
  stageScale,
  onTransform,
  onTransformEnd,
  onHover,
}: AnnotationElementProps) {
  const { id, bbox, color } = element;
  const { x, y, w, h } = bbox.pixel;
  const displayLabel = getDisplayLabel(element);

  const strokeColor = getElementStroke(color);
  const fillColor = getElementFill(color, isSelected, isHovered);
  const textWidth = getLabelWidth(displayLabel, labelConfig.fontSize);
  const labelWidth = Math.min(
    textWidth + labelConfig.padding * 2,
    labelConfig.maxWidth
  );
  const needsEllipsis =
    textWidth + labelConfig.padding * 2 > labelConfig.maxWidth;

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => onTransform(e, id),
    [onTransform, id]
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => onTransformEnd(e, id),
    [onTransformEnd, id]
  );

  const handleMouseEnter = useCallback(() => onHover(id), [onHover, id]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  return (
    <Group name={`element-${id}`} x={x} y={y}>
      {/* Label background and text */}
      <Group
        name={`label-${id}`}
        scaleX={1 / stageScale}
        scaleY={1 / stageScale}
        x={-1 / stageScale}
        y={-(labelConfig.height + labelConfig.gap) / stageScale}
      >
        <Rect
          cornerRadius={2}
          fill={strokeColor}
          height={labelConfig.height}
          listening={false}
          width={labelWidth}
        />
        <Text
          ellipsis={needsEllipsis}
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontSize={labelConfig.fontSize}
          listening={false}
          text={displayLabel}
          width={
            needsEllipsis
              ? labelConfig.maxWidth - labelConfig.padding * 2
              : undefined
          }
          wrap="none"
          x={labelConfig.padding}
          y={labelConfig.padding}
        />
      </Group>
      {/* Bounding box - listening enabled for Transformer and hover */}
      <Rect
        fill={fillColor}
        height={h}
        id={id}
        listening={true}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        stroke={strokeColor}
        strokeScaleEnabled={false}
        strokeWidth={isSelected || isHovered ? 2 : 1}
        width={w}
      />
    </Group>
  );
});
