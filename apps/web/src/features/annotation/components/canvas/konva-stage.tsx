import type Konva from "konva";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import { Layer, Stage } from "react-konva";
import type { Point } from "@/types";
import { canvasConfig } from "../../constants/canvas";
import type { CanvasMode } from "../../lib/canvas-utils";
import {
	selectActiveGuidelines,
	selectElements,
	selectProject,
	useAnnotationStore,
	useUIStore,
} from "../../store";
import { AnnotationsLayer, TransformerLayer } from "./annotations-layer";
import { DrawingOverlay } from "./drawing-overlay";
import { ImageLayer } from "./image-layer";

/** Get distance between two touch points */
const getDistance = (
	p1: { x: number; y: number },
	p2: { x: number; y: number },
) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

/** Get center point between two touch points */
const getCenter = (
	p1: { x: number; y: number },
	p2: { x: number; y: number },
) => ({
	x: (p1.x + p2.x) / 2,
	y: (p1.y + p2.y) / 2,
});

interface KonvaStageProps {
	containerWidth: number;
	containerHeight: number;
	image: HTMLImageElement | null;
	mode: CanvasMode;
	drawCurrent: Point | null;
	isReady: boolean;
	isAltPressed: boolean;
	onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
	onMouseMove: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
	onMouseUp: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
	onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
	onHover: (id: string | null) => void;
}

/**
 * Konva Stage component with viewport management.
 * Handles zooming, panning, and layer composition.
 */
export const KonvaStage = forwardRef<Konva.Stage, KonvaStageProps>(
	function KonvaStage(
		{
			containerWidth,
			containerHeight,
			image,
			mode,
			drawCurrent,
			isReady,
			isAltPressed,
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onDblClick,
			onHover,
		},
		ref,
	) {
		// Store state
		const project = useAnnotationStore(selectProject);
		const elements = useAnnotationStore(selectElements);
		const viewport = useAnnotationStore((state) => state.viewport);

		// Get image size from project
		const imageSize = useMemo(
			() =>
				project
					? { width: project.imageWidth, height: project.imageHeight }
					: null,
			[project],
		);
		const activeTool = useAnnotationStore((state) => state.activeTool);
		const selectedIds = useAnnotationStore(
			(state) => state.selection.selectedIds,
		);

		// Store actions
		const setOffset = useAnnotationStore((state) => state.setOffset);
		const setViewport = useAnnotationStore((state) => state.setViewport);

		// UI state
		const guidelines = useUIStore(selectActiveGuidelines);
		const hoveredId = useUIStore((state) => state.hoveredId);

		// Derived viewport values
		const stageScale = viewport.scale;
		const stagePos = useMemo(
			() => ({ x: viewport.offsetX, y: viewport.offsetY }),
			[viewport.offsetX, viewport.offsetY],
		);

		// Sort elements by displayOrder
		const sortedElements = useMemo(
			() => [...elements].sort((a, b) => a.displayOrder - b.displayOrder),
			[elements],
		);

		/**
		 * Handle wheel event for zoom and pan.
		 * Ctrl/Meta + wheel always zooms (any mode).
		 * Plain wheel pans.
		 */
		const handleWheel = useCallback(
			(e: Konva.KonvaEventObject<WheelEvent>) => {
				e.evt.preventDefault();
				const stage = (ref as React.RefObject<Konva.Stage>)?.current;
				if (!stage) return;

				// Ctrl/Meta + wheel always zooms regardless of mode
				const shouldZoom = e.evt.ctrlKey || e.evt.metaKey;

				if (shouldZoom) {
					// Zoom towards pointer position
					const oldScale = stageScale;
					const pointer = stage.getPointerPosition();
					if (!pointer) return;

					const mousePointTo = {
						x: (pointer.x - stagePos.x) / oldScale,
						y: (pointer.y - stagePos.y) / oldScale,
					};

					const direction = e.evt.deltaY > 0 ? -1 : 1;
					const factor = direction > 0 ? 1.1 : 0.9;
					const newScale = Math.min(
						Math.max(oldScale * factor, canvasConfig.minScale),
						canvasConfig.maxScale,
					);

					const newX = pointer.x - mousePointTo.x * newScale;
					const newY = pointer.y - mousePointTo.y * newScale;
					setViewport(newScale, newX, newY);
				} else {
					// Pan
					const newX = stagePos.x - e.evt.deltaX;
					const newY = stagePos.y - e.evt.deltaY;
					setOffset(newX, newY);
				}
			},
			[ref, stageScale, stagePos, setViewport, setOffset],
		);

		/**
		 * Handle drag end for pan mode.
		 */
		const handleDragEnd = useCallback(
			(e: Konva.KonvaEventObject<DragEvent>) => {
				const stage = (ref as React.RefObject<Konva.Stage>)?.current;
				if (activeTool === "pan" && e.target === stage) {
					setOffset(e.target.x(), e.target.y());
				}
			},
			[ref, activeTool, setOffset],
		);

		// Pinch-to-zoom state - stores initial pinch values for delta calculation
		const pinchRef = useRef<{
			initialDistance: number;
			initialScale: number;
			initialPos: { x: number; y: number };
		} | null>(null);

		/**
		 * Handle touch start - detect pinch gesture start.
		 */
		const handleTouchStart = useCallback(
			(e: Konva.KonvaEventObject<TouchEvent>) => {
				const touches = e.evt.touches;
				const stage = (ref as React.RefObject<Konva.Stage>)?.current;

				if (touches.length === 2) {
					// Two fingers - start pinch
					e.evt.preventDefault();
					if (stage) stage.stopDrag();

					const p1 = { x: touches[0].clientX, y: touches[0].clientY };
					const p2 = { x: touches[1].clientX, y: touches[1].clientY };

					// Store initial state for the entire pinch gesture
					pinchRef.current = {
						initialDistance: getDistance(p1, p2),
						initialScale: stage?.scaleX() ?? stageScale,
						initialPos: {
							x: stage?.x() ?? stagePos.x,
							y: stage?.y() ?? stagePos.y,
						},
					};
				} else if (touches.length === 1) {
					// Single finger - pass to normal handler
					pinchRef.current = null;
					onMouseDown(e);
				}
			},
			[ref, stageScale, stagePos, onMouseDown],
		);

		/**
		 * Handle touch move - directly manipulate Konva stage for smooth pinch zoom.
		 * Store is only updated on touch end for performance.
		 */
		const handleTouchMove = useCallback(
			(e: Konva.KonvaEventObject<TouchEvent>) => {
				const touches = e.evt.touches;
				const stage = (ref as React.RefObject<Konva.Stage>)?.current;

				if (touches.length === 2) {
					e.evt.preventDefault();
					if (!stage) return;

					const p1 = { x: touches[0].clientX, y: touches[0].clientY };
					const p2 = { x: touches[1].clientX, y: touches[1].clientY };
					const currentDistance = getDistance(p1, p2);
					const center = getCenter(p1, p2);

					// Initialize if second finger just added
					if (!pinchRef.current) {
						stage.stopDrag();
						pinchRef.current = {
							initialDistance: currentDistance,
							initialScale: stage.scaleX(),
							initialPos: { x: stage.x(), y: stage.y() },
						};
						return;
					}

					// Calculate new scale from initial state
					const scaleRatio = currentDistance / pinchRef.current.initialDistance;
					const newScale = Math.min(
						Math.max(
							pinchRef.current.initialScale * scaleRatio,
							canvasConfig.minScale,
						),
						canvasConfig.maxScale,
					);

					// Calculate position to zoom towards pinch center
					const stageRect = stage.container().getBoundingClientRect();
					const pointerX = center.x - stageRect.left;
					const pointerY = center.y - stageRect.top;

					const mousePointTo = {
						x:
							(pointerX - pinchRef.current.initialPos.x) /
							pinchRef.current.initialScale,
						y:
							(pointerY - pinchRef.current.initialPos.y) /
							pinchRef.current.initialScale,
					};

					const newX = pointerX - mousePointTo.x * newScale;
					const newY = pointerY - mousePointTo.y * newScale;

					// Directly update Konva stage (no React state update = smooth)
					stage.scale({ x: newScale, y: newScale });
					stage.position({ x: newX, y: newY });
					stage.batchDraw();
				} else if (touches.length === 1 && !pinchRef.current) {
					onMouseMove(e);
				}
			},
			[ref, onMouseMove],
		);

		/**
		 * Handle touch end - sync final viewport state to store.
		 */
		const handleTouchEnd = useCallback(
			(e: Konva.KonvaEventObject<TouchEvent>) => {
				const stage = (ref as React.RefObject<Konva.Stage>)?.current;

				if (pinchRef.current) {
					// Sync final pinch state to store
					if (stage) {
						setViewport(stage.scaleX(), stage.x(), stage.y());
					}
					pinchRef.current = null;
				} else {
					onMouseUp(e);
				}
			},
			[ref, setViewport, onMouseUp],
		);

		/**
		 * Get cursor based on current state.
		 */
		const getCursor = useCallback(() => {
			if (activeTool === "pan") return "grab";
			if (activeTool !== "edit") return "default";
			if (mode.type === "dragging") return "move";
			if (isAltPressed) return "crosshair";
			return "default";
		}, [activeTool, mode.type, isAltPressed]);

		if (!project || !imageSize) return null;

		const { width: imageWidth, height: imageHeight } = imageSize;

		return (
			<Stage
				ref={ref}
				width={containerWidth}
				height={containerHeight}
				x={stagePos.x}
				y={stagePos.y}
				scaleX={stageScale}
				scaleY={stageScale}
				draggable={activeTool === "pan"}
				onWheel={handleWheel}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onDblClick={onDblClick}
				onDragEnd={handleDragEnd}
				style={{
					cursor: getCursor(),
					opacity: isReady ? 1 : 0,
					transition: "opacity 300ms ease-out",
					touchAction: "none",
				}}
			>
				{/* Image Layer */}
				<ImageLayer image={image} width={imageWidth} height={imageHeight} />

				{/* Annotations Layer */}
				<AnnotationsLayer
					sortedElements={sortedElements}
					selectedIds={selectedIds}
					hoveredId={hoveredId}
					stageScale={stageScale}
					onHover={onHover}
				/>

				{/* Drawing Overlay Layer */}
				<Layer>
					<DrawingOverlay
						mode={mode}
						drawCurrent={drawCurrent}
						guidelines={guidelines}
						imageWidth={imageWidth}
						imageHeight={imageHeight}
					/>
				</Layer>

				{/* Transformer Layer */}
				<TransformerLayer
					activeTool={activeTool}
					selectedIds={selectedIds}
					stageRef={ref as React.RefObject<Konva.Stage | null>}
				/>
			</Stage>
		);
	},
);
