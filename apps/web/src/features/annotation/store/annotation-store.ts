import type { WritableDraft } from "immer";
import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createBBox, updateBBoxPixel } from "@/lib/geometry";
import { loadImageFromUrl } from "@/lib/image";
import { throttle } from "@/lib/throttle";
import type { EditorElement, Project } from "@/types";
import { canvasConfig } from "../constants/canvas";
import { createElement } from "../services/element-factory";
import {
	type AnnotationState,
	type AnnotationStore,
	initialClipboardState,
	initialContainerSize,
	initialDrawingState,
	initialSelectionState,
	initialViewportState,
} from "./types";

/** Storage key for persist middleware */
const STORAGE_KEY = "ui-annotator-project";

/**
 * Initial annotation state
 */
const initialState = {
	// Project (persisted)
	project: null as Project | null,
	// Loaded image (1:1 with project, not persisted)
	image: null as HTMLImageElement | null,
	// Elements (for undo/redo, synced with project)
	elements: [] as EditorElement[],
	// Ephemeral state
	selection: initialSelectionState,
	drawing: initialDrawingState,
	viewport: initialViewportState,
	containerSize: initialContainerSize,
	activeTool: "edit" as const,
	clipboard: initialClipboardState,
};

/**
 * Get image size from project
 */
const getImageSize = (project: Project | null) =>
	project ? { width: project.imageWidth, height: project.imageHeight } : null;

/**
 * Sync elements to project after mutation.
 * Call this at the end of any action that modifies elements.
 */
function syncElementsToProject(state: WritableDraft<AnnotationState>): void {
	if (state.project) {
		state.project.elements = state.elements;
		state.project.updatedAt = new Date().toISOString();
	}
}

/**
 * Annotation Store
 *
 * Unified store for annotation editing:
 * - Project metadata and persistence
 * - Elements (with undo/redo support)
 * - Selection, Drawing, Viewport, Tool state
 *
 * Uses persist + temporal + immer middlewares.
 */
export const useAnnotationStore = create<AnnotationStore>()(
	persist(
		temporal(
			immer((set, get) => ({
				...initialState,

				// ============================================
				// Project Actions
				// ============================================

				loadProject: (project, image) => {
					set((state) => {
						state.project = project;
						// Cast needed: HTMLImageElement is immutable and not a draft target
						state.image = image as unknown as typeof state.image;
						state.elements = project.elements;
						state.selection = initialSelectionState;
						state.viewport = initialViewportState;
						state.drawing = initialDrawingState;
					});
				},

				clearProject: () => {
					set((state) => {
						state.project = null;
						state.image = null;
						state.elements = [];
						state.selection = initialSelectionState;
						state.viewport = initialViewportState;
						state.drawing = initialDrawingState;
					});
				},

				// ============================================
				// Element Actions
				// ============================================

				setElements: (elements) => {
					set((state) => {
						state.elements = elements;
						syncElementsToProject(state);
					});
				},

				addElement: (element) => {
					set((state) => {
						state.elements.push(element);
						syncElementsToProject(state);
					});
				},

				updateElement: (id, updates) => {
					set((state) => {
						const element = state.elements.find((e) => e.id === id);
						if (!element) return;

						// Handle null values for optional fields
						if (updates.component === null) {
							element.component = undefined;
						} else if (updates.component !== undefined) {
							element.component = updates.component;
						}
						// Apply other updates
						if (updates.label !== undefined) element.label = updates.label;
						if (updates.bbox !== undefined) element.bbox = updates.bbox;
						if (updates.notes !== undefined)
							element.notes = updates.notes || undefined;
						if (updates.color !== undefined) element.color = updates.color;
						if (updates.displayOrder !== undefined)
							element.displayOrder = updates.displayOrder;
						element.updatedAt = new Date().toISOString();

						syncElementsToProject(state);
					});
				},

				deleteElement: (id) => {
					set((state) => {
						state.elements = state.elements.filter((e) => e.id !== id);
						state.selection.selectedIds = state.selection.selectedIds.filter(
							(selectedId) => selectedId !== id,
						);
						syncElementsToProject(state);
					});
				},

				moveElement: (id, deltaX, deltaY) => {
					set((state) => {
						const element = state.elements.find((e) => e.id === id);
						const imageSize = getImageSize(state.project);
						if (!element || !imageSize) return;

						const newPixel = {
							x: element.bbox.pixel.x + deltaX,
							y: element.bbox.pixel.y + deltaY,
						};

						element.bbox = updateBBoxPixel(element.bbox, newPixel, {
							w: imageSize.width,
							h: imageSize.height,
						});
						element.updatedAt = new Date().toISOString();

						syncElementsToProject(state);
					});
				},

				deleteSelectedElements: () => {
					set((state) => {
						if (state.selection.selectedIds.length === 0) return;

						const idsToDelete = state.selection.selectedIds;
						state.elements = state.elements.filter(
							(e) => !idsToDelete.includes(e.id),
						);
						state.selection.selectedIds = [];

						syncElementsToProject(state);
					});
				},

				reorderElements: (oldIndex, newIndex) => {
					set((state) => {
						const [removed] = state.elements.splice(oldIndex, 1);
						state.elements.splice(newIndex, 0, removed);
						state.elements.forEach((e, i) => {
							e.displayOrder = i;
						});

						syncElementsToProject(state);
					});
				},

				// ============================================
				// Selection Actions
				// ============================================

				selectElement: (id, addToSelection = false) => {
					set((state) => {
						if (addToSelection) {
							if (!state.selection.selectedIds.includes(id)) {
								state.selection.selectedIds.push(id);
							}
						} else {
							state.selection.selectedIds = [id];
						}
					});
				},

				deselectAll: () => {
					set((state) => {
						state.selection.selectedIds = [];
					});
				},

				// ============================================
				// Clipboard Actions
				// ============================================

				copySelectedElements: () => {
					const state = get();
					const selectedElements = state.elements.filter((e) =>
						state.selection.selectedIds.includes(e.id),
					);
					if (selectedElements.length === 0) return;

					set((s) => {
						// Deep copy elements for clipboard
						s.clipboard.elements = JSON.parse(JSON.stringify(selectedElements));
					});
				},

				pasteElements: () => {
					const state = get();
					const { clipboard, elements, project } = state;
					const imageSize = getImageSize(project);

					if (clipboard.elements.length === 0 || !imageSize) return;

					const pasteOffset = 20; // Offset in pixels for pasted elements
					const newElements: EditorElement[] = [];
					const newIds: EditorElement["id"][] = [];

					for (const clipboardElement of clipboard.elements) {
						const { pixel } = clipboardElement.bbox;
						// Apply offset without boundary constraints (allow annotations outside image)
						const newBbox = createBBox(
							{
								x: pixel.x + pasteOffset,
								y: pixel.y + pasteOffset,
								w: pixel.w,
								h: pixel.h,
							},
							{ w: imageSize.width, h: imageSize.height },
						);

						const newElement = createElement({
							bbox: newBbox,
							label: clipboardElement.label,
							component: clipboardElement.component,
							notes: clipboardElement.notes,
							color: clipboardElement.color,
							existingElements: [...elements, ...newElements],
						});

						newElements.push(newElement);
						newIds.push(newElement.id);
					}

					set((s) => {
						s.elements.push(...newElements);
						s.selection.selectedIds = newIds;
						// Update clipboard with new positions for subsequent paste
						s.clipboard.elements = JSON.parse(JSON.stringify(newElements));
						syncElementsToProject(s);
					});
				},

				// ============================================
				// Drawing Actions
				// ============================================

				startDrawing: (point) => {
					set((state) => {
						state.drawing = {
							isDrawing: true,
							startPoint: point,
							currentPoint: point,
						};
					});
				},

				updateDrawing: (point) => {
					set((state) => {
						if (state.drawing.isDrawing) {
							state.drawing.currentPoint = point;
						}
					});
				},

				finishDrawing: () => {
					const state = get();
					const { drawing, project, elements } = state;
					const imageSize = getImageSize(project);

					if (
						!drawing.isDrawing ||
						!drawing.startPoint ||
						!drawing.currentPoint ||
						!imageSize
					) {
						set((s) => {
							s.drawing = initialDrawingState;
						});
						return null;
					}

					const { startPoint, currentPoint } = drawing;
					const x = Math.min(startPoint.x, currentPoint.x);
					const y = Math.min(startPoint.y, currentPoint.y);
					const w = Math.abs(currentPoint.x - startPoint.x);
					const h = Math.abs(currentPoint.y - startPoint.y);

					if (
						w < canvasConfig.minAnnotationSize ||
						h < canvasConfig.minAnnotationSize
					) {
						set((s) => {
							s.drawing = initialDrawingState;
						});
						return null;
					}

					const bbox = createBBox(
						{ x, y, w, h },
						{ w: imageSize.width, h: imageSize.height },
					);

					const element = createElement({
						bbox,
						existingElements: elements,
					});

					set((s) => {
						s.elements.push(element);
						s.drawing = initialDrawingState;
						s.selection.selectedIds = [element.id];
						syncElementsToProject(s);
					});

					return element;
				},

				cancelDrawing: () => {
					set((state) => {
						state.drawing = initialDrawingState;
					});
				},

				// ============================================
				// Viewport Actions
				// ============================================

				setScale: (scale) => {
					set((state) => {
						const { minScale, maxScale } = state.viewport;
						state.viewport.scale = Math.min(
							Math.max(scale, minScale),
							maxScale,
						);
					});
				},

				setOffset: (x, y) => {
					set((state) => {
						state.viewport.offsetX = x;
						state.viewport.offsetY = y;
					});
				},

				setViewport: (scale, offsetX, offsetY) => {
					set((state) => {
						const { minScale, maxScale } = state.viewport;
						state.viewport.scale = Math.min(
							Math.max(scale, minScale),
							maxScale,
						);
						state.viewport.offsetX = offsetX;
						state.viewport.offsetY = offsetY;
					});
				},

				setContainerSize: (width, height) => {
					set((state) => {
						state.containerSize = { width, height };
					});
				},

				zoomIn: () => {
					set((state) => {
						const { width, height } = state.containerSize;
						if (width === 0 || height === 0) return;

						const oldScale = state.viewport.scale;
						const newScale = Math.min(
							oldScale * canvasConfig.zoomFactor,
							state.viewport.maxScale,
						);

						// Zoom towards screen center
						const centerX = width / 2;
						const centerY = height / 2;
						const worldX = (centerX - state.viewport.offsetX) / oldScale;
						const worldY = (centerY - state.viewport.offsetY) / oldScale;

						state.viewport.scale = newScale;
						state.viewport.offsetX = centerX - worldX * newScale;
						state.viewport.offsetY = centerY - worldY * newScale;
					});
				},

				zoomOut: () => {
					set((state) => {
						const { width, height } = state.containerSize;
						if (width === 0 || height === 0) return;

						const oldScale = state.viewport.scale;
						const newScale = Math.max(
							oldScale / canvasConfig.zoomFactor,
							state.viewport.minScale,
						);

						// Zoom towards screen center
						const centerX = width / 2;
						const centerY = height / 2;
						const worldX = (centerX - state.viewport.offsetX) / oldScale;
						const worldY = (centerY - state.viewport.offsetY) / oldScale;

						state.viewport.scale = newScale;
						state.viewport.offsetX = centerX - worldX * newScale;
						state.viewport.offsetY = centerY - worldY * newScale;
					});
				},

				zoomToFit: () => {
					set((state) => {
						const imageSize = getImageSize(state.project);
						if (!imageSize) return;
						const { width: containerWidth, height: containerHeight } =
							state.containerSize;
						if (containerWidth === 0 || containerHeight === 0) return;

						const { width: imageWidth, height: imageHeight } = imageSize;
						const scaleX = containerWidth / imageWidth;
						const scaleY = containerHeight / imageHeight;
						const scale = Math.min(scaleX, scaleY) * canvasConfig.fitPadding;

						state.viewport.scale = Math.min(
							Math.max(scale, state.viewport.minScale),
							state.viewport.maxScale,
						);
						state.viewport.offsetX =
							(containerWidth - imageWidth * state.viewport.scale) / 2;
						state.viewport.offsetY =
							(containerHeight - imageHeight * state.viewport.scale) / 2;
					});
				},

				centerAt100: () => {
					set((state) => {
						const imageSize = getImageSize(state.project);
						if (!imageSize) return;
						const { width: containerWidth, height: containerHeight } =
							state.containerSize;
						if (containerWidth === 0 || containerHeight === 0) return;

						const { width: imageWidth, height: imageHeight } = imageSize;
						state.viewport.scale = 1;
						state.viewport.offsetX = (containerWidth - imageWidth) / 2;
						state.viewport.offsetY = (containerHeight - imageHeight) / 2;
					});
				},

				resetViewport: () => {
					set((state) => {
						state.viewport = initialViewportState;
					});
				},

				// ============================================
				// Tool Actions
				// ============================================

				setActiveTool: (tool) => {
					set((state) => {
						state.activeTool = tool;
						if (tool !== "edit") {
							state.drawing = initialDrawingState;
						}
					});
				},

				// ============================================
				// Reset
				// ============================================

				reset: () => {
					set(() => ({ ...initialState }));
				},
			})),
			{
				// Temporal config for undo/redo
				partialize: (state) => ({
					elements: state.elements,
				}),
				limit: 50,
				equality: (pastState, currentState) =>
					JSON.stringify(pastState.elements) ===
					JSON.stringify(currentState.elements),
				handleSet: (handleSet) =>
					throttle(handleSet, 500, { leading: true, trailing: true }),
			},
		),
		{
			name: STORAGE_KEY,
			partialize: (state) => ({
				project: state.project,
				elements: state.elements,
			}),
			onRehydrateStorage: () => (state) => {
				// Sync elements from persisted project on hydration
				if (state?.project?.elements) {
					state.elements = state.project.elements;
				}
			},
		},
	),
);

/**
 * Auto-load image when project exists but image is null.
 *
 * This handles the page reload scenario where the project is restored
 * from localStorage but the image (HTMLImageElement) cannot be serialized.
 * The store self-heals by loading the image from the project's imageUrl.
 */
let isLoadingImage = false;
useAnnotationStore.subscribe((state) => {
	// Skip if no project, no imageUrl, image already exists, or already loading
	if (!state.project?.imageUrl || state.image || isLoadingImage) return;

	isLoadingImage = true;
	loadImageFromUrl(state.project.imageUrl)
		.then((loadedImage) => {
			useAnnotationStore.setState({ image: loadedImage });
		})
		.catch((error) => {
			console.error("Failed to load project image:", error);
		})
		.finally(() => {
			isLoadingImage = false;
		});
});

/**
 * Temporal store for undo/redo operations
 */
export const annotationTemporalStore = useAnnotationStore.temporal;

/**
 * Sync state after undo/redo operation.
 * - Filters out invalid selections (deleted elements)
 * - Syncs elements back to project
 */
function syncAfterTemporalChange(): void {
	const state = useAnnotationStore.getState();
	const elementIds = new Set(state.elements.map((e) => e.id));
	const validSelection = state.selection.selectedIds.filter((id) =>
		elementIds.has(id),
	);

	useAnnotationStore.setState((s) => {
		if (validSelection.length !== s.selection.selectedIds.length) {
			s.selection.selectedIds = validSelection;
		}
		if (s.project) {
			s.project.elements = s.elements;
			s.project.updatedAt = new Date().toISOString();
		}
	});
}

/**
 * Undo the last action
 */
export const undoAnnotation = () => {
	const temporal = annotationTemporalStore.getState();
	if (temporal.pastStates.length === 0) return;

	temporal.undo();
	syncAfterTemporalChange();
};

/**
 * Redo the last undone action
 */
export const redoAnnotation = () => {
	const temporal = annotationTemporalStore.getState();
	if (temporal.futureStates.length === 0) return;

	temporal.redo();
	syncAfterTemporalChange();
};
