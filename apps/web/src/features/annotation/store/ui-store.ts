import { create } from "zustand";
import type { ElementId } from "@/types";

/**
 * Snap guideline for visual feedback
 */
export interface SnapGuideline {
  type: "vertical" | "horizontal";
  /** Position (x for vertical, y for horizontal) */
  position: number;
  /** Start position (y for vertical, x for horizontal) */
  start: number;
  /** End position */
  end: number;
}

/**
 * UI state
 */
interface UIState {
  /** Currently hovered element ID */
  hoveredId: ElementId | null;
  /** Element ID being edited (label) */
  editingLabelId: ElementId | null;
  /** Focus trigger for label input (increment to trigger) */
  labelFocusTrigger: number;
  /** Focus trigger for canvas (increment to trigger) */
  canvasFocusTrigger: number;
  /** Active snap guidelines for visual feedback */
  activeGuidelines: SnapGuideline[];
}

/**
 * UI actions
 */
interface UIActions {
  /** Set hovered element */
  setHovered: (id: ElementId | null) => void;
  /** Start editing element label */
  startEditingLabel: (id: ElementId) => void;
  /** Stop editing label */
  stopEditingLabel: () => void;
  /** Trigger label input focus */
  triggerLabelFocus: () => void;
  /** Trigger canvas focus */
  focusCanvas: () => void;
  /** Set active snap guidelines */
  setActiveGuidelines: (guidelines: SnapGuideline[]) => void;
  /** Clear all snap guidelines */
  clearActiveGuidelines: () => void;
  /** Reset all UI state */
  resetUIState: () => void;
}

/**
 * Initial UI state
 */
const initialUIState: UIState = {
  hoveredId: null,
  editingLabelId: null,
  labelFocusTrigger: 0,
  canvasFocusTrigger: 0,
  activeGuidelines: [],
};

/**
 * UI Store
 * @description Manages ephemeral UI state (hover, editing, focus, validation)
 * Separate from main annotator store for performance and clarity
 */
export const useUIStore = create<UIState & UIActions>()((set) => ({
  ...initialUIState,

  setHovered: (id) => set({ hoveredId: id }),

  startEditingLabel: (id) => set({ editingLabelId: id }),
  stopEditingLabel: () => set({ editingLabelId: null }),

  triggerLabelFocus: () =>
    set((state) => ({ labelFocusTrigger: state.labelFocusTrigger + 1 })),

  focusCanvas: () =>
    set((state) => ({ canvasFocusTrigger: state.canvasFocusTrigger + 1 })),

  setActiveGuidelines: (guidelines) => set({ activeGuidelines: guidelines }),
  clearActiveGuidelines: () => set({ activeGuidelines: [] }),

  resetUIState: () => set(initialUIState),
}));

// ============================================
// Selectors
// ============================================

/** Select active snap guidelines */
export const selectActiveGuidelines = (state: UIState) =>
  state.activeGuidelines;
