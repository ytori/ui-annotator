import type { EditorElement, ElementId, Point } from "@/types";

/**
 * Canvas interaction mode state.
 * - idle: No active interaction
 * - dragging: Moving an existing element
 * - drawing: Creating a new annotation
 */
export type CanvasMode =
  | { type: "idle" }
  | { type: "dragging"; elementId: ElementId; offset: { x: number; y: number } }
  | { type: "drawing"; start: { x: number; y: number } };

/**
 * Check if a point is inside an element's bounding box.
 */
export function isPointInElement(
  point: Point,
  element: EditorElement
): boolean {
  const { x, y, w, h } = element.bbox.pixel;
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
}

/**
 * Find all elements at a given point, sorted by displayOrder (highest first).
 */
export function findElementsAtPoint(
  point: Point,
  elements: EditorElement[]
): EditorElement[] {
  return elements
    .filter((el) => isPointInElement(point, el))
    .sort((a, b) => b.displayOrder - a.displayOrder);
}

/**
 * Find the first selected element at point.
 */
export function findSelectedElementAtPoint(
  point: Point,
  elements: EditorElement[],
  selectedIds: ElementId[]
): EditorElement | null {
  for (const id of selectedIds) {
    const element = elements.find((el) => el.id === id);
    if (element && isPointInElement(point, element)) {
      return element;
    }
  }
  return null;
}
