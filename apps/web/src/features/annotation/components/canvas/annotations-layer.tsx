import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Layer, Transformer } from "react-konva";
import { createBBox } from "@/lib/geometry";
import type { EditorElement, ElementId } from "@/types";
import { canvasConfig } from "../../constants/canvas";
import { colorToRgb, primaryColors } from "../../constants/colors";
import { useKonvaSnap } from "../../hooks/use-konva-snap";
import { selectElements, selectProject, useAnnotationStore } from "../../store";
import { AnnotationElement } from "./annotation-element";

interface AnnotationsLayerProps {
	sortedElements: EditorElement[];
	selectedIds: ElementId[];
	hoveredId: ElementId | null;
	stageScale: number;
	onHover: (id: ElementId | null) => void;
}

/**
 * Renders annotation elements and the transform handler.
 * Manages element selection and transformation.
 */
export function AnnotationsLayer({
	sortedElements,
	selectedIds,
	hoveredId,
	stageScale,
	onHover,
}: AnnotationsLayerProps) {
	const elements = useAnnotationStore(selectElements);
	const project = useAnnotationStore(selectProject);
	const imageSize = useMemo(
		() =>
			project
				? { width: project.imageWidth, height: project.imageHeight }
				: null,
		[project],
	);
	const updateElement = useAnnotationStore((state) => state.updateElement);
	const { getResizeSnapResult, clearGuidelines } = useKonvaSnap();

	/**
	 * Handle element transformation with snap support.
	 *
	 * Snapping adjusts position/scale while keeping the opposite edge fixed:
	 * - snapLeft: moves left edge, right edge stays fixed
	 * - snapRight: moves right edge, left edge stays fixed
	 * - snapTop: moves top edge, bottom edge stays fixed
	 * - snapBottom: moves bottom edge, top edge stays fixed
	 */
	const handleElementTransform = useCallback(
		(e: Konva.KonvaEventObject<Event>, id: ElementId) => {
			if (!imageSize) return;

			const rect = e.target as Konva.Rect;
			const group = rect.getParent();
			if (!group) return;

			// Transfer position changes from Rect to Group so label follows
			const rectX = rect.x();
			const rectY = rect.y();
			if (rectX !== 0 || rectY !== 0) {
				group.x(group.x() + rectX);
				group.y(group.y() + rectY);
				rect.x(0);
				rect.y(0);
			}

			// Get current absolute position and size
			const absX = group.x();
			const absY = group.y();
			const absW = rect.width() * rect.scaleX();
			const absH = rect.height() * rect.scaleY();

			const edges = {
				left: absX,
				right: absX + absW,
				top: absY,
				bottom: absY + absH,
			};

			const { snapLeft, snapRight, snapTop, snapBottom } = getResizeSnapResult(
				edges,
				elements,
				id,
				imageSize?.width ?? 0,
				imageSize?.height ?? 0,
			);

			// Apply snaps independently, keeping opposite edge fixed
			let newLeft = edges.left;
			let newRight = edges.right;
			let newTop = edges.top;
			let newBottom = edges.bottom;

			// Horizontal snaps (mutually exclusive to prevent conflicts)
			if (snapLeft !== null) {
				// Snap left edge, keep right edge fixed
				newLeft = snapLeft;
			} else if (snapRight !== null) {
				// Snap right edge, keep left edge fixed
				newRight = snapRight;
			}

			// Vertical snaps (mutually exclusive to prevent conflicts)
			if (snapTop !== null) {
				// Snap top edge, keep bottom edge fixed
				newTop = snapTop;
			} else if (snapBottom !== null) {
				// Snap bottom edge, keep top edge fixed
				newBottom = snapBottom;
			}

			// Calculate new position and scale from adjusted edges
			const newW = newRight - newLeft;
			const newH = newBottom - newTop;

			group.x(newLeft);
			group.y(newTop);
			rect.scaleX(newW / rect.width());
			rect.scaleY(newH / rect.height());
		},
		[elements, imageSize, getResizeSnapResult],
	);

	/**
	 * Handle transform end - commit changes to store.
	 */
	const handleTransformEnd = useCallback(
		(e: Konva.KonvaEventObject<Event>, id: ElementId) => {
			if (!imageSize) return;

			const node = e.target as Konva.Rect;
			const group = node.getParent();
			const scaleX = node.scaleX();
			const scaleY = node.scaleY();

			const groupX = group ? group.x() : 0;
			const groupY = group ? group.y() : 0;
			const newX = groupX + node.x();
			const newY = groupY + node.y();
			const newW = Math.max(
				node.width() * scaleX,
				canvasConfig.minAnnotationSize,
			);
			const newH = Math.max(
				node.height() * scaleY,
				canvasConfig.minAnnotationSize,
			);

			// Reset Rect position and scale
			node.x(0);
			node.y(0);
			node.scaleX(1);
			node.scaleY(1);
			node.width(newW);
			node.height(newH);

			const bbox = createBBox(
				{ x: newX, y: newY, w: newW, h: newH },
				{ w: imageSize.width, h: imageSize.height },
			);

			updateElement(id, { bbox });
			clearGuidelines();
		},
		[imageSize, updateElement, clearGuidelines],
	);

	return (
		<Layer>
			{sortedElements.map((element) => (
				<AnnotationElement
					key={element.id}
					element={element}
					isSelected={selectedIds.includes(element.id)}
					isHovered={hoveredId === element.id}
					stageScale={stageScale}
					onTransform={handleElementTransform}
					onTransformEnd={handleTransformEnd}
					onHover={onHover}
				/>
			))}
		</Layer>
	);
}

interface TransformerLayerProps {
	activeTool: string;
	selectedIds: ElementId[];
	stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * Separate layer for Transformer to not affect annotation z-order.
 */
export function TransformerLayer({
	activeTool,
	selectedIds,
	stageRef,
}: TransformerLayerProps) {
	const transformerRef = useRef<Konva.Transformer>(null);
	const primaryColor = colorToRgb(primaryColors.primary);

	// Update transformer nodes when selection changes
	useEffect(() => {
		if (!transformerRef.current || !stageRef.current) return;

		const stage = stageRef.current;

		requestAnimationFrame(() => {
			if (!transformerRef.current) return;

			const selectedNodes = selectedIds
				.map((id) => stage.findOne(`#${id}`))
				.filter((node): node is Konva.Rect => node !== undefined);

			transformerRef.current.nodes(selectedNodes);
			transformerRef.current.getLayer()?.batchDraw();
		});
	}, [selectedIds, stageRef]);

	const handleBoundBoxFunc = useCallback(
		(
			oldBox: {
				x: number;
				y: number;
				width: number;
				height: number;
				rotation: number;
			},
			newBox: {
				x: number;
				y: number;
				width: number;
				height: number;
				rotation: number;
			},
		) => {
			if (
				newBox.width < canvasConfig.minAnnotationSize ||
				newBox.height < canvasConfig.minAnnotationSize
			) {
				return oldBox;
			}
			return newBox;
		},
		[],
	);

	return (
		<Layer>
			{activeTool === "edit" && (
				<Transformer
					ref={transformerRef}
					rotateEnabled={false}
					keepRatio={false}
					ignoreStroke={true}
					borderEnabled={false}
					anchorSize={8}
					anchorStroke={primaryColor}
					anchorStrokeWidth={1}
					anchorFill="white"
					anchorCornerRadius={2}
					enabledAnchors={[
						"top-left",
						"top-center",
						"top-right",
						"middle-left",
						"middle-right",
						"bottom-left",
						"bottom-center",
						"bottom-right",
					]}
					boundBoxFunc={handleBoundBoxFunc}
				/>
			)}
		</Layer>
	);
}
