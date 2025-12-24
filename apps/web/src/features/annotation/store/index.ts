/**
 * Annotation Store
 *
 * State management for annotation editing.
 */

// Store
export {
  annotationTemporalStore,
  redoAnnotation,
  undoAnnotation,
  useAnnotationStore,
} from "./annotation-store";

// Selectors
export {
  selectContainerSize,
  selectElements,
  selectFirstSelectedElement,
  selectImage,
  selectProject,
  selectSelectedIds,
} from "./selectors";

// Types
export type {
  AnnotationActions,
  AnnotationState,
  AnnotationStore,
  ContainerSize,
  DrawingState,
  SelectionState,
  ToolMode,
  ViewportState,
} from "./types";
export {
  initialContainerSize,
  initialDrawingState,
  initialSelectionState,
  initialViewportState,
} from "./types";

// UI Store
export {
  type SnapGuideline,
  selectActiveGuidelines,
  useUIStore,
} from "./ui-store";
