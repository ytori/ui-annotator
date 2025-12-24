import type { EditorElement, ElementId, ElementUpdate, Project } from "@/types";

// ============================================
// State Types
// ============================================

/** Viewport state */
export interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;
}

/** Container size state */
export interface ContainerSize {
  width: number;
  height: number;
}

/** Selection state */
export interface SelectionState {
  selectedIds: ElementId[];
}

/** Drawing state */
export interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

/** Clipboard state for copy/paste */
export interface ClipboardState {
  elements: EditorElement[];
}

/** Tool mode type */
export type ToolMode = "edit" | "pan";

// ============================================
// Initial States
// ============================================

export const initialViewportState: ViewportState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  minScale: 0.1,
  maxScale: 5,
};

export const initialContainerSize: ContainerSize = {
  width: 0,
  height: 0,
};

export const initialSelectionState: SelectionState = {
  selectedIds: [],
};

export const initialDrawingState: DrawingState = {
  isDrawing: false,
  startPoint: null,
  currentPoint: null,
};

export const initialClipboardState: ClipboardState = {
  elements: [],
};

// ============================================
// Annotation Store State & Actions
// ============================================

/**
 * Annotation store state
 * Contains project, elements, selection, drawing, viewport, and tool state
 */
export interface AnnotationState {
  // Project (persisted)
  project: Project | null;
  // Loaded image (1:1 with project, not persisted)
  image: HTMLImageElement | null;
  // Elements (synced with project, for undo/redo)
  elements: EditorElement[];
  // Ephemeral state
  selection: SelectionState;
  drawing: DrawingState;
  viewport: ViewportState;
  containerSize: ContainerSize;
  activeTool: ToolMode;
  // Clipboard (ephemeral, not persisted)
  clipboard: ClipboardState;
}

/**
 * Annotation store actions
 */
export interface AnnotationActions {
  // Project actions
  /** Load project with its image (both must be ready) */
  loadProject: (project: Project, image: HTMLImageElement) => void;
  clearProject: () => void;

  // Element actions
  setElements: (elements: EditorElement[]) => void;
  addElement: (element: EditorElement) => void;
  updateElement: (id: ElementId, updates: ElementUpdate) => void;
  deleteElement: (id: ElementId) => void;
  moveElement: (id: ElementId, deltaX: number, deltaY: number) => void;
  deleteSelectedElements: () => void;
  reorderElements: (oldIndex: number, newIndex: number) => void;

  // Selection actions
  selectElement: (id: ElementId, addToSelection?: boolean) => void;
  deselectAll: () => void;

  // Clipboard actions
  copySelectedElements: () => void;
  pasteElements: () => void;

  // Drawing actions
  startDrawing: (point: { x: number; y: number }) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => EditorElement | null;
  cancelDrawing: () => void;

  // Viewport actions
  setScale: (scale: number) => void;
  setOffset: (x: number, y: number) => void;
  /** Batch update scale and offset in a single state update (for performance) */
  setViewport: (scale: number, offsetX: number, offsetY: number) => void;
  setContainerSize: (width: number, height: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  centerAt100: () => void;
  resetViewport: () => void;

  // Tool actions
  setActiveTool: (tool: ToolMode) => void;

  // Reset
  reset: () => void;
}

/**
 * Full annotation store type
 */
export type AnnotationStore = AnnotationState & AnnotationActions;
