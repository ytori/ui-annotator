import type Konva from "konva";
import { useCallback, useMemo, useState } from "react";
import { createBBox } from "@/lib/geometry";
import type { Point } from "@/types";
import { canvasConfig } from "../constants/canvas";
import type { CanvasMode } from "../lib/canvas-utils";
import {
	findElementsAtPoint,
	findSelectedElementAtPoint,
} from "../lib/canvas-utils";
import { createElement } from "../services/element-factory";
import {
	selectElements,
	selectProject,
	useAnnotationStore,
	useUIStore,
} from "../store";
import { useKonvaSnap } from "./use-konva-snap";

interface UseCanvasInteractionProps {
	stageRef: React.RefObject<Konva.Stage | null>;
}

type PointerEvent = MouseEvent | TouchEvent;

interface UseCanvasInteractionReturn {
	mode: CanvasMode;
	drawCurrent: Point | null;
	handleMouseDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
	handleMouseMove: (e: Konva.KonvaEventObject<PointerEvent>) => void;
	handleMouseUp: (e: Konva.KonvaEventObject<PointerEvent>) => void;
	handleDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
	clearMode: () => void;
}

/**
 * Custom hook for canvas mouse interactions.
 * Handles drawing, dragging, and element selection logic.
 */
export function useCanvasInteraction({
	stageRef,
}: UseCanvasInteractionProps): UseCanvasInteractionReturn {
	const [mode, setMode] = useState<CanvasMode>({ type: "idle" });
	const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);

	// Store state
	const elements = useAnnotationStore(selectElements);
	const project = useAnnotationStore(selectProject);
	const imageSize = useMemo(
		() =>
			project
				? { width: project.imageWidth, height: project.imageHeight }
				: null,
		[project],
	);
	const selectedIds = useAnnotationStore(
		(state) => state.selection.selectedIds,
	);
	const activeTool = useAnnotationStore((state) => state.activeTool);

	// Store actions
	const selectElement = useAnnotationStore((state) => state.selectElement);
	const deselectAll = useAnnotationStore((state) => state.deselectAll);
	const updateElement = useAnnotationStore((state) => state.updateElement);
	const addElement = useAnnotationStore((state) => state.addElement);

	// UI state
	const setHoveredRaw = useUIStore((state) => state.setHovered);

	// Snap hook
	const { getSnapResult, clearGuidelines } = useKonvaSnap();

	/**
	 * Get pointer position relative to image coordinates.
	 */
	const getImagePointerPosition = useCallback((): Point | null => {
		const stage = stageRef.current;
		if (!stage) return null;
		const pos = stage.getRelativePointerPosition();
		if (!pos) return null;
		return { x: pos.x, y: pos.y };
	}, [stageRef]);

	/**
	 * Check if target is part of Transformer.
	 */
	const isTransformerTarget = useCallback((target: Konva.Node): boolean => {
		if (target.getParent()?.className === "Transformer") return true;
		if (target.className === "Transformer") return true;
		return false;
	}, []);

	/**
	 * Handle mouse/touch down event for drawing and dragging.
	 */
	const handleMouseDown = useCallback(
		(e: Konva.KonvaEventObject<PointerEvent>) => {
			if (activeTool !== "edit") return;
			if (!imageSize) return;

			// Let Transformer handle its own events
			if (isTransformerTarget(e.target)) return;

			const pos = getImagePointerPosition();
			if (!pos) return;

			// Alt + click = force drawing mode (only for mouse events)
			const isAltPressed = e.evt instanceof MouseEvent ? e.evt.altKey : false;
			if (isAltPressed) {
				setHoveredRaw(null);
				setMode({ type: "drawing", start: pos });
				setDrawCurrent(pos);
				return;
			}

			// Priority 1: Selected element at point (for dragging)
			const selectedHit = findSelectedElementAtPoint(
				pos,
				elements,
				selectedIds,
			);
			if (selectedHit) {
				setHoveredRaw(null);
				setMode({
					type: "dragging",
					elementId: selectedHit.id,
					offset: {
						x: pos.x - selectedHit.bbox.pixel.x,
						y: pos.y - selectedHit.bbox.pixel.y,
					},
				});
				return;
			}

			// Priority 2: Top element at point (select and drag)
			const elementsAtPoint = findElementsAtPoint(pos, elements);
			if (elementsAtPoint.length > 0) {
				const topElement = elementsAtPoint[0];
				selectElement(topElement.id);
				setHoveredRaw(null);
				setMode({
					type: "dragging",
					elementId: topElement.id,
					offset: {
						x: pos.x - topElement.bbox.pixel.x,
						y: pos.y - topElement.bbox.pixel.y,
					},
				});
				return;
			}

			// Empty area - start drawing
			deselectAll();
			setHoveredRaw(null);
			setMode({ type: "drawing", start: pos });
			setDrawCurrent(pos);
		},
		[
			activeTool,
			imageSize,
			elements,
			selectedIds,
			isTransformerTarget,
			getImagePointerPosition,
			selectElement,
			deselectAll,
			setHoveredRaw,
		],
	);

	/**
	 * Handle mouse/touch move for drawing preview and element dragging.
	 */
	const handleMouseMove = useCallback(
		(_e: Konva.KonvaEventObject<PointerEvent>) => {
			const pos = getImagePointerPosition();
			if (!pos) return;

			if (mode.type === "drawing" && imageSize) {
				// Update drawing preview with snap
				const snapped = getSnapResult(
					pos,
					elements,
					[],
					imageSize.width,
					imageSize.height,
				);
				setDrawCurrent(snapped);
			} else if (mode.type === "dragging" && imageSize) {
				// Move element with snap
				const element = elements.find((el) => el.id === mode.elementId);
				if (!element) return;

				const newX = pos.x - mode.offset.x;
				const newY = pos.y - mode.offset.y;

				const snapped = getSnapResult(
					{ x: newX, y: newY },
					elements,
					[mode.elementId],
					imageSize.width,
					imageSize.height,
					{
						x: newX,
						y: newY,
						w: element.bbox.pixel.w,
						h: element.bbox.pixel.h,
					},
				);

				const bbox = createBBox(
					{
						x: snapped.x,
						y: snapped.y,
						w: element.bbox.pixel.w,
						h: element.bbox.pixel.h,
					},
					{ w: imageSize.width, h: imageSize.height },
				);
				updateElement(mode.elementId, { bbox });
			}
		},
		[
			mode,
			elements,
			imageSize,
			getImagePointerPosition,
			getSnapResult,
			updateElement,
		],
	);

	/**
	 * Handle mouse/touch up for completing drawing or dragging.
	 */
	const handleMouseUp = useCallback(
		(_e: Konva.KonvaEventObject<PointerEvent>) => {
			if (!imageSize) {
				setMode({ type: "idle" });
				setDrawCurrent(null);
				clearGuidelines();
				return;
			}

			if (mode.type === "drawing" && drawCurrent) {
				const { start } = mode;
				const x = Math.min(start.x, drawCurrent.x);
				const y = Math.min(start.y, drawCurrent.y);
				const w = Math.abs(drawCurrent.x - start.x);
				const h = Math.abs(drawCurrent.y - start.y);

				if (
					w >= canvasConfig.minAnnotationSize &&
					h >= canvasConfig.minAnnotationSize
				) {
					const bbox = createBBox(
						{ x, y, w, h },
						{ w: imageSize.width, h: imageSize.height },
					);

					const newElement = createElement({
						bbox,
						existingElements: elements,
					});

					addElement(newElement);
					selectElement(newElement.id);
				}
			}

			setMode({ type: "idle" });
			setDrawCurrent(null);
			clearGuidelines();
		},
		[
			mode,
			drawCurrent,
			elements,
			imageSize,
			addElement,
			selectElement,
			clearGuidelines,
		],
	);

	/**
	 * Handle double click to cycle through overlapping elements.
	 */
	const handleDblClick = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			if (activeTool !== "edit") return;
			if (isTransformerTarget(e.target)) return;

			const pos = getImagePointerPosition();
			if (!pos) return;

			const elementsAtPoint = findElementsAtPoint(pos, elements);
			if (elementsAtPoint.length <= 1) return;

			// Find current selected element in the stack
			const currentSelectedId = selectedIds.length > 0 ? selectedIds[0] : null;
			const currentIndex = currentSelectedId
				? elementsAtPoint.findIndex((el) => el.id === currentSelectedId)
				: -1;

			// Cycle to next element
			const nextIndex =
				currentIndex >= 0 ? (currentIndex + 1) % elementsAtPoint.length : 0;
			const nextElement = elementsAtPoint[nextIndex];

			selectElement(nextElement.id);
		},
		[
			activeTool,
			elements,
			selectedIds,
			isTransformerTarget,
			getImagePointerPosition,
			selectElement,
		],
	);

	/**
	 * Clear the current mode and guidelines.
	 */
	const clearMode = useCallback(() => {
		setMode({ type: "idle" });
		setDrawCurrent(null);
		clearGuidelines();
	}, [clearGuidelines]);

	return {
		mode,
		drawCurrent,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleDblClick,
		clearMode,
	};
}
