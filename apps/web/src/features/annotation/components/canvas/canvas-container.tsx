import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBBox } from "@/lib/geometry";
import { useCanvasInteraction } from "../../hooks/use-canvas-interaction";
import {
  selectImage,
  selectProject,
  useAnnotationStore,
  useUIStore,
} from "../../store";
import { KonvaStage } from "./konva-stage";

/**
 * Move selected elements by arrow key direction.
 * Returns true if elements were moved, false if no action taken.
 */
function moveSelectedElements(key: string, shiftKey: boolean): boolean {
  const { elements, project, selection, updateElement } =
    useAnnotationStore.getState();

  if (!project || selection.selectedIds.length === 0) {
    return false;
  }

  const step = shiftKey ? 10 : 1;
  let dx = 0;
  if (key === "ArrowLeft") {
    dx = -step;
  } else if (key === "ArrowRight") {
    dx = step;
  }
  let dy = 0;
  if (key === "ArrowUp") {
    dy = -step;
  } else if (key === "ArrowDown") {
    dy = step;
  }

  const { imageWidth, imageHeight } = project;

  for (const id of selection.selectedIds) {
    const element = elements.find((el: { id: string }) => el.id === id);
    if (!element) {
      continue;
    }

    const { x, y, w, h } = element.bbox.pixel;
    const bbox = createBBox(
      { x: x + dx, y: y + dy, w, h },
      { w: imageWidth, h: imageHeight }
    );
    updateElement(id, { bbox });
  }

  return true;
}

/**
 * Main canvas container component.
 *
 * Responsibilities:
 * - Container sizing (ResizeObserver)
 * - Keyboard event handling (arrow keys, enter)
 * - Viewport initialization (zoomToFit on new image)
 * - Composing KonvaStage with interaction handlers
 *
 * Note: Image loading is handled by the annotation store (self-healing pattern).
 */
export function CanvasContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Store state
  const project = useAnnotationStore(selectProject);
  const image = useAnnotationStore(selectImage);
  const containerSize = useAnnotationStore((state) => state.containerSize);

  // Store actions
  const setContainerSize = useAnnotationStore(
    (state) => state.setContainerSize
  );

  // UI state
  const triggerLabelFocus = useUIStore((state) => state.triggerLabelFocus);
  const canvasFocusTrigger = useUIStore((state) => state.canvasFocusTrigger);
  const setHoveredRaw = useUIStore((state) => state.setHovered);

  // Local state
  const [isReady, setIsReady] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);

  // Canvas interaction hook
  const {
    mode,
    drawCurrent,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDblClick,
  } = useCanvasInteraction({ stageRef });

  // Hover handler that ignores updates during drag/draw
  const setHovered = useCallback(
    (id: string | null) => {
      if (mode.type !== "idle") {
        return;
      }
      setHoveredRaw(id);
    },
    [mode.type, setHoveredRaw]
  );

  // ============================================
  // Keyboard Handlers
  // ============================================

  // Global Alt key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setIsAltPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setIsAltPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Canvas-local keyboard handler
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter key triggers label editing
      if (e.key === "Enter") {
        const currentSelectedIds =
          useAnnotationStore.getState().selection.selectedIds;
        if (currentSelectedIds.length === 1) {
          e.preventDefault();
          triggerLabelFocus();
          return;
        }
      }

      // Arrow keys move selected elements
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        moveSelectedElements(e.key, e.shiftKey)
      ) {
        e.preventDefault();
      }
    },
    [triggerLabelFocus]
  );

  // Focus canvas when triggered from other components
  useEffect(() => {
    if (canvasFocusTrigger > 0) {
      containerRef.current?.focus();
    }
  }, [canvasFocusTrigger]);

  // ============================================
  // Container & Viewport Setup
  // ============================================

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize(width, height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [setContainerSize]);

  // ============================================
  // Viewport Initialization
  // ============================================

  // Track which image has been initialized
  // Using image reference (not URL) ensures re-initialization on consecutive same-file opens
  // because a new HTMLImageElement is created each time
  const initializedImageRef = useRef<HTMLImageElement | null>(null);

  // Derive readiness from current state
  const canInitialize =
    project !== null &&
    image !== null &&
    containerSize.width > 0 &&
    containerSize.height > 0;

  // Initialize viewport when all requirements are met
  useEffect(() => {
    if (!(canInitialize && image)) {
      setIsReady(false);
      return;
    }

    // Check if already initialized for this exact image instance
    // (same reference means same load, different reference means new load)
    if (initializedImageRef.current === image) {
      setIsReady(true);
      return;
    }

    // Initialize: zoom to fit and mark as ready
    initializedImageRef.current = image;
    useAnnotationStore.getState().zoomToFit();
    setIsReady(true);
  }, [canInitialize, image]);

  // ============================================
  // Render
  // ============================================

  const focusContainer = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      className="canvas-background h-full w-full overflow-hidden focus:outline-none"
      onKeyDown={handleCanvasKeyDown}
      onMouseDown={focusContainer}
      onTouchStart={focusContainer}
      ref={containerRef}
      role="application"
      style={{ touchAction: "none" }}
      tabIndex={0}
    >
      {project && (
        <KonvaStage
          containerHeight={containerSize.height}
          containerWidth={containerSize.width}
          drawCurrent={drawCurrent}
          image={image}
          isAltPressed={isAltPressed}
          isReady={isReady}
          mode={mode}
          onDblClick={handleDblClick}
          onHover={setHovered}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={stageRef}
        />
      )}
    </div>
  );
}
