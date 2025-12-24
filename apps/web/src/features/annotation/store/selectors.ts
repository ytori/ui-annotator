import type { EditorElement } from "@/types";
import type { AnnotationState } from "./types";

/** Stable empty array for when elements is empty */
const EMPTY_ELEMENTS: EditorElement[] = [];

// ============================================
// Project Selectors
// ============================================

/** Select project */
export const selectProject = (state: AnnotationState) => state.project;

/** Select loaded image element */
export const selectImage = (state: AnnotationState) => state.image;

// ============================================
// Element Selectors
// ============================================

/** Select all elements */
export const selectElements = (state: AnnotationState) =>
  state.elements.length > 0 ? state.elements : EMPTY_ELEMENTS;

/** Select first selected element */
export const selectFirstSelectedElement = (state: AnnotationState) => {
  const { elements, selection } = state;
  if (elements.length === 0 || selection.selectedIds.length === 0) {
    return null;
  }
  const id = selection.selectedIds[0];
  return elements.find((e) => e.id === id) ?? null;
};

// ============================================
// Selection Selectors
// ============================================

/** Select all selected IDs */
export const selectSelectedIds = (state: AnnotationState) =>
  state.selection.selectedIds;

// ============================================
// Viewport Selectors
// ============================================

/** Select container size */
export const selectContainerSize = (state: AnnotationState) =>
  state.containerSize;
