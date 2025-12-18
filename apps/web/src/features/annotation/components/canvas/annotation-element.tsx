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
	hovered: boolean,
): string {
	const alpha = selected ? 0.15 : hovered ? 0.1 : 0.05;
	return colorToRgba(getElementRgb(color), alpha);
}

// Calculate label width accounting for full-width characters (Japanese, etc.)
export function getLabelWidth(text: string, fontSize: number): number {
	let width = 0;
	for (const char of text) {
		const code = char.charCodeAt(0);
		const isFullWidth =
			(code >= 0x3000 && code <= 0x9fff) || // CJK
			(code >= 0xff00 && code <= 0xffef) || // Full-width forms
			(code >= 0xac00 && code <= 0xd7af); // Korean
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
		labelConfig.maxWidth,
	);
	const needsEllipsis =
		textWidth + labelConfig.padding * 2 > labelConfig.maxWidth;

	const handleTransform = useCallback(
		(e: Konva.KonvaEventObject<Event>) => onTransform(e, id),
		[onTransform, id],
	);

	const handleTransformEnd = useCallback(
		(e: Konva.KonvaEventObject<Event>) => onTransformEnd(e, id),
		[onTransformEnd, id],
	);

	const handleMouseEnter = useCallback(() => onHover(id), [onHover, id]);
	const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

	return (
		<Group name={`element-${id}`} x={x} y={y}>
			{/* Label background and text */}
			<Group
				name={`label-${id}`}
				x={-1 / stageScale}
				y={-(labelConfig.height + labelConfig.gap) / stageScale}
				scaleX={1 / stageScale}
				scaleY={1 / stageScale}
			>
				<Rect
					height={labelConfig.height}
					width={labelWidth}
					fill={strokeColor}
					cornerRadius={2}
					listening={false}
				/>
				<Text
					x={labelConfig.padding}
					y={labelConfig.padding}
					text={displayLabel}
					fontSize={labelConfig.fontSize}
					fontFamily="system-ui, sans-serif"
					fill="white"
					width={
						needsEllipsis
							? labelConfig.maxWidth - labelConfig.padding * 2
							: undefined
					}
					wrap="none"
					ellipsis={needsEllipsis}
					listening={false}
				/>
			</Group>
			{/* Bounding box - listening enabled for Transformer and hover */}
			<Rect
				id={id}
				width={w}
				height={h}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth={isSelected || isHovered ? 2 : 1}
				strokeScaleEnabled={false}
				listening={true}
				onTransform={handleTransform}
				onTransformEnd={handleTransformEnd}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			/>
		</Group>
	);
});
