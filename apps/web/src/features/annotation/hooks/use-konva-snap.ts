import { useCallback } from "react";
import type { EditorElement, ElementId } from "@/types";
import { snapConfig } from "../constants/canvas";
import { useUIStore } from "../store";

interface SnapTarget {
  value: number;
  type: "edge" | "center" | "bound";
}

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SnapResult {
  value: number;
  guidelinePosition: number;
}

interface SnapTargets {
  vertical: SnapTarget[];
  horizontal: SnapTarget[];
}

// ============================================
// Helper: Collect Snap Targets
// ============================================

/** Collect snap targets from elements and image bounds */
function collectSnapTargets(
  elements: EditorElement[],
  excludeIds: ElementId[],
  imageWidth: number,
  imageHeight: number
): SnapTargets {
  const vertical: SnapTarget[] = [];
  const horizontal: SnapTarget[] = [];

  // Add element edges and centers
  for (const element of elements) {
    if (excludeIds.includes(element.id)) {
      continue;
    }

    const { x, y, w, h } = element.bbox.pixel;

    vertical.push(
      { value: x, type: "edge" },
      { value: x + w, type: "edge" },
      { value: x + w / 2, type: "center" }
    );

    horizontal.push(
      { value: y, type: "edge" },
      { value: y + h, type: "edge" },
      { value: y + h / 2, type: "center" }
    );
  }

  // Add image bounds
  vertical.push(
    { value: 0, type: "bound" },
    { value: imageWidth / 2, type: "bound" },
    { value: imageWidth, type: "bound" }
  );
  horizontal.push(
    { value: 0, type: "bound" },
    { value: imageHeight / 2, type: "bound" },
    { value: imageHeight, type: "bound" }
  );

  return { vertical, horizontal };
}

// ============================================
// Helper: Calculate Check Points
// ============================================

/** Get points to check for snapping based on moving box */
function getCheckPoints(
  point: { x: number; y: number },
  movingBox?: BoundingBox
): { xPoints: number[]; yPoints: number[] } {
  if (movingBox) {
    return {
      xPoints: [point.x, point.x + movingBox.w, point.x + movingBox.w / 2],
      yPoints: [point.y, point.y + movingBox.h, point.y + movingBox.h / 2],
    };
  }
  return { xPoints: [point.x], yPoints: [point.y] };
}

/** Calculate offset based on which check point matched */
function calculateOffset(checkIndex: number, boxSize: number): number {
  if (checkIndex === 0) {
    return 0;
  }
  if (checkIndex === 1) {
    return -boxSize;
  }
  return -boxSize / 2;
}

// ============================================
// Helper: Find Best Snap
// ============================================

/** Find best snap position for a single axis */
function findBestAxisSnap(
  checkPoints: number[],
  targets: SnapTarget[],
  boxSize: number
): SnapResult | null {
  let bestSnap: SnapResult | null = null;
  let minDistance = snapConfig.threshold;

  for (let i = 0; i < checkPoints.length; i++) {
    const checkValue = checkPoints[i];
    for (const target of targets) {
      const distance = Math.abs(checkValue - target.value);
      if (distance < minDistance) {
        minDistance = distance;
        const offset = calculateOffset(i, boxSize);
        bestSnap = {
          value: target.value + offset,
          guidelinePosition: target.value,
        };
      }
    }
  }

  return bestSnap;
}

// ============================================
// Helper: Build Guidelines
// ============================================

interface Guideline {
  type: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
}

/** Build guidelines from snap results */
function buildGuidelines(
  xSnap: SnapResult | null,
  ySnap: SnapResult | null,
  imageWidth: number,
  imageHeight: number
): Guideline[] {
  const guidelines: Guideline[] = [];

  if (xSnap) {
    guidelines.push({
      type: "vertical",
      position: xSnap.guidelinePosition,
      start: 0,
      end: imageHeight,
    });
  }

  if (ySnap) {
    guidelines.push({
      type: "horizontal",
      position: ySnap.guidelinePosition,
      start: 0,
      end: imageWidth,
    });
  }

  return guidelines;
}

// ============================================
// Helper: Resize Snap
// ============================================

/** Collect simple numeric targets for resize snapping */
function collectResizeTargets(
  elements: EditorElement[],
  excludeId: ElementId,
  imageWidth: number,
  imageHeight: number
): { vertical: number[]; horizontal: number[] } {
  const vertical = [0, imageWidth / 2, imageWidth];
  const horizontal = [0, imageHeight / 2, imageHeight];

  for (const element of elements) {
    if (element.id === excludeId) {
      continue;
    }
    const { x, y, w, h } = element.bbox.pixel;
    vertical.push(x, x + w, x + w / 2);
    horizontal.push(y, y + h, y + h / 2);
  }

  return { vertical, horizontal };
}

/** Find snap for a single edge value */
function findEdgeSnap(edgeValue: number, targets: number[]): number | null {
  for (const target of targets) {
    if (Math.abs(edgeValue - target) < snapConfig.threshold) {
      return target;
    }
  }
  return null;
}

// ============================================
// Main Hook
// ============================================

export function useKonvaSnap() {
  const setActiveGuidelines = useUIStore((state) => state.setActiveGuidelines);
  const clearActiveGuidelines = useUIStore(
    (state) => state.clearActiveGuidelines
  );

  const getSnapResult = useCallback(
    (
      point: { x: number; y: number },
      elements: EditorElement[],
      excludeIds: ElementId[],
      imageWidth: number,
      imageHeight: number,
      movingBox?: BoundingBox
    ): { x: number; y: number } => {
      // Collect all snap targets
      const targets = collectSnapTargets(
        elements,
        excludeIds,
        imageWidth,
        imageHeight
      );

      // Get points to check
      const { xPoints, yPoints } = getCheckPoints(point, movingBox);

      // Find best snaps
      const xSnap = findBestAxisSnap(
        xPoints,
        targets.vertical,
        movingBox?.w ?? 0
      );
      const ySnap = findBestAxisSnap(
        yPoints,
        targets.horizontal,
        movingBox?.h ?? 0
      );

      // Update guidelines
      const guidelines = buildGuidelines(xSnap, ySnap, imageWidth, imageHeight);
      setActiveGuidelines(guidelines);

      return {
        x: xSnap ? xSnap.value : point.x,
        y: ySnap ? ySnap.value : point.y,
      };
    },
    [setActiveGuidelines]
  );

  const clearGuidelines = useCallback(() => {
    clearActiveGuidelines();
  }, [clearActiveGuidelines]);

  const getResizeSnapResult = useCallback(
    (
      edges: { left: number; right: number; top: number; bottom: number },
      elements: EditorElement[],
      excludeId: ElementId,
      imageWidth: number,
      imageHeight: number
    ): {
      snapLeft: number | null;
      snapRight: number | null;
      snapTop: number | null;
      snapBottom: number | null;
      guidelines: Array<{ type: "vertical" | "horizontal"; position: number }>;
    } => {
      // Collect targets
      const targets = collectResizeTargets(
        elements,
        excludeId,
        imageWidth,
        imageHeight
      );

      // Find edge snaps
      const snapLeft = findEdgeSnap(edges.left, targets.vertical);
      const snapRight = findEdgeSnap(edges.right, targets.vertical);
      const snapTop = findEdgeSnap(edges.top, targets.horizontal);
      const snapBottom = findEdgeSnap(edges.bottom, targets.horizontal);

      // Build guidelines
      const guidelines: Array<{
        type: "vertical" | "horizontal";
        position: number;
      }> = [];

      if (snapLeft !== null) {
        guidelines.push({ type: "vertical", position: snapLeft });
      }
      if (snapRight !== null) {
        guidelines.push({ type: "vertical", position: snapRight });
      }
      if (snapTop !== null) {
        guidelines.push({ type: "horizontal", position: snapTop });
      }
      if (snapBottom !== null) {
        guidelines.push({ type: "horizontal", position: snapBottom });
      }

      setActiveGuidelines(
        guidelines.map((g) => ({
          ...g,
          start: 0,
          end: g.type === "vertical" ? imageHeight : imageWidth,
        }))
      );

      return { snapLeft, snapRight, snapTop, snapBottom, guidelines };
    },
    [setActiveGuidelines]
  );

  return { getSnapResult, getResizeSnapResult, clearGuidelines };
}
