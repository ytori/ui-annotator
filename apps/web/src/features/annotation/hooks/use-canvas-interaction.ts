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
    [project]
  );
  const selectedIds = useAnnotationStore(
    (state) => state.selection.selectedIds
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
    if (!stage) {
      return null;
    }
    const pos = stage.getRelativePointerPosition();
    if (!pos) {
      return null;
    }
    return { x: pos.x, y: pos.y };
  }, [stageRef]);

  /**
   * Check if target is part of Transformer.
   */
  const isTransformerTarget = useCallback((target: Konva.Node): boolean => {
    if (target.getParent()?.className === "Transformer") {
      return true;
    }
    if (target.className === "Transformer") {
      return true;
    }
    return false;
  }, []);

  // ============================================
  // Mouse Down Helpers
  // ============================================

  /** Start drawing mode at the given position */
  const startDrawingMode = useCallback(
    (pos: Point) => {
      setHoveredRaw(null);
      setMode({ type: "drawing", start: pos });
      setDrawCurrent(pos);
    },
    [setHoveredRaw]
  );

  /** Start drag mode for an element */
  const startDragMode = useCallback(
    (elementId: string, pos: Point, elementPos: { x: number; y: number }) => {
      setHoveredRaw(null);
      setMode({
        type: "dragging",
        elementId,
        offset: { x: pos.x - elementPos.x, y: pos.y - elementPos.y },
      });
    },
    [setHoveredRaw]
  );

  /** Check if interaction should be blocked */
  const canInteract = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>): boolean => {
      if (activeTool !== "edit") {
        return false;
      }
      if (!imageSize) {
        return false;
      }
      if (isTransformerTarget(e.target)) {
        return false;
      }
      return true;
    },
    [activeTool, imageSize, isTransformerTarget]
  );

  /** Check if Alt key is pressed (mouse only) */
  const isAltClick = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>): boolean => {
      return e.evt instanceof MouseEvent && e.evt.altKey;
    },
    []
  );

  /** Reset interaction state to idle */
  const resetInteractionState = useCallback(() => {
    setMode({ type: "idle" });
    setDrawCurrent(null);
    clearGuidelines();
  }, [clearGuidelines]);

  // ============================================
  // Mouse Move Helpers
  // ============================================

  /** Update drawing preview position with snap */
  const updateDrawingPreview = useCallback(
    (pos: Point) => {
      if (!imageSize) {
        return;
      }
      const snapped = getSnapResult(
        pos,
        elements,
        [],
        imageSize.width,
        imageSize.height
      );
      setDrawCurrent(snapped);
    },
    [elements, imageSize, getSnapResult]
  );

  /** Update dragging element position with snap */
  const updateDraggingPosition = useCallback(
    (pos: Point, elementId: string, offset: Point) => {
      if (!imageSize) {
        return;
      }

      const element = elements.find((el) => el.id === elementId);
      if (!element) {
        return;
      }

      const newX = pos.x - offset.x;
      const newY = pos.y - offset.y;

      const snapped = getSnapResult(
        { x: newX, y: newY },
        elements,
        [elementId],
        imageSize.width,
        imageSize.height,
        {
          x: newX,
          y: newY,
          w: element.bbox.pixel.w,
          h: element.bbox.pixel.h,
        }
      );

      const bbox = createBBox(
        {
          x: snapped.x,
          y: snapped.y,
          w: element.bbox.pixel.w,
          h: element.bbox.pixel.h,
        },
        { w: imageSize.width, h: imageSize.height }
      );
      updateElement(elementId, { bbox });
    },
    [elements, imageSize, getSnapResult, updateElement]
  );

  // ============================================
  // Mouse Up Helpers
  // ============================================

  /** Finalize drawing by creating a new element if valid */
  const finalizeDrawing = useCallback(
    (start: Point, end: Point) => {
      if (!imageSize) {
        return;
      }

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      // Only create if meets minimum size
      if (
        w < canvasConfig.minAnnotationSize ||
        h < canvasConfig.minAnnotationSize
      ) {
        return;
      }

      const bbox = createBBox(
        { x, y, w, h },
        { w: imageSize.width, h: imageSize.height }
      );

      const newElement = createElement({
        bbox,
        existingElements: elements,
      });

      addElement(newElement);
      selectElement(newElement.id);
    },
    [imageSize, elements, addElement, selectElement]
  );

  /**
   * Handle mouse/touch down event for drawing and dragging.
   * Priority: Alt+click → Selected element → Any element → Empty area
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      if (!canInteract(e)) {
        return;
      }

      const pos = getImagePointerPosition();
      if (!pos) {
        return;
      }

      // Alt + click = force drawing mode
      if (isAltClick(e)) {
        startDrawingMode(pos);
        return;
      }

      // Try drag selected element
      const selectedHit = findSelectedElementAtPoint(
        pos,
        elements,
        selectedIds
      );
      if (selectedHit) {
        startDragMode(selectedHit.id, pos, selectedHit.bbox.pixel);
        return;
      }

      // Try select and drag top element
      const elementsAtPoint = findElementsAtPoint(pos, elements);
      if (elementsAtPoint.length > 0) {
        const topElement = elementsAtPoint[0];
        selectElement(topElement.id);
        startDragMode(topElement.id, pos, topElement.bbox.pixel);
        return;
      }

      // Empty area - start drawing
      deselectAll();
      startDrawingMode(pos);
    },
    [
      canInteract,
      getImagePointerPosition,
      isAltClick,
      startDrawingMode,
      startDragMode,
      elements,
      selectedIds,
      selectElement,
      deselectAll,
    ]
  );

  /**
   * Handle mouse/touch move for drawing preview and element dragging.
   */
  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<PointerEvent>) => {
      const pos = getImagePointerPosition();
      if (!pos) {
        return;
      }

      if (mode.type === "drawing") {
        updateDrawingPreview(pos);
      } else if (mode.type === "dragging") {
        updateDraggingPosition(pos, mode.elementId, mode.offset);
      }
    },
    [
      mode,
      getImagePointerPosition,
      updateDrawingPreview,
      updateDraggingPosition,
    ]
  );

  /**
   * Handle mouse/touch up for completing drawing or dragging.
   */
  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<PointerEvent>) => {
      // Finalize drawing if in drawing mode
      if (mode.type === "drawing" && drawCurrent) {
        finalizeDrawing(mode.start, drawCurrent);
      }

      // Always reset to idle state
      resetInteractionState();
    },
    [mode, drawCurrent, finalizeDrawing, resetInteractionState]
  );

  /**
   * Handle double click to cycle through overlapping elements.
   */
  const handleDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "edit") {
        return;
      }
      if (isTransformerTarget(e.target)) {
        return;
      }

      const pos = getImagePointerPosition();
      if (!pos) {
        return;
      }

      const elementsAtPoint = findElementsAtPoint(pos, elements);
      if (elementsAtPoint.length <= 1) {
        return;
      }

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
    ]
  );

  /**
   * Clear the current mode and guidelines.
   */
  const clearMode = useCallback(() => {
    resetInteractionState();
  }, [resetInteractionState]);

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
