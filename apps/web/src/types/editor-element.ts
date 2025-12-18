import { z } from "zod";
import { type ComponentSpec, componentSpecSchema } from "./component";
import type { Element } from "./element";
import { type BBox, bboxSchema } from "./geometry";

/**
 * Editor Element Types
 *
 * Extended element types with editor-specific fields.
 * Shared across annotation and storage features.
 */

// ============================================
// Element Color
// ============================================

export const ELEMENT_COLOR_VALUES = [
	"blue",
	"sky",
	"cyan",
	"teal",
	"green",
	"lime",
	"yellow",
	"amber",
	"orange",
	"red",
	"rose",
	"pink",
	"fuchsia",
	"purple",
	"violet",
	"indigo",
	"slate",
	"gray",
] as const;

export const elementColorSchema = z.enum(ELEMENT_COLOR_VALUES);

export type ElementColor = z.infer<typeof elementColorSchema>;

// ============================================
// Editor Element
// ============================================

/**
 * Editor element schema with UI-specific fields.
 * Extends the base Element with color, displayOrder, timestamps.
 */
export const editorElementSchema = z.object({
	// Core fields (same as Element)
	id: z.string(),
	label: z.string(),
	bbox: bboxSchema,
	component: componentSpecSchema.optional(),
	notes: z.string().optional(),
	// Editor-specific fields
	/** Auto-assigned serial number at creation time (immutable, for display fallback) */
	serialNumber: z.number().int().positive(),
	color: elementColorSchema.optional(),
	displayOrder: z.number().int().nonnegative(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export type EditorElement = z.infer<typeof editorElementSchema>;

// ============================================
// Element Update
// ============================================

/**
 * Partial update for an editor element.
 */
export interface ElementUpdate {
	label?: string;
	bbox?: BBox;
	component?: ComponentSpec | null;
	notes?: string;
	color?: ElementColor;
	displayOrder?: number;
}

// ============================================
// Conversion Utilities
// ============================================

/**
 * Convert EditorElement to base Element (for export).
 * Uses serialNumber as label fallback if label is empty.
 */
export function toElement(editorElement: EditorElement): Element {
	return {
		id: editorElement.id,
		label: getDisplayLabel(editorElement),
		bbox: editorElement.bbox,
		component: editorElement.component,
		notes: editorElement.notes,
	};
}

/**
 * Convert EditorElement array to Element array.
 */
export function toElements(editorElements: EditorElement[]): Element[] {
	return editorElements.map(toElement);
}

/**
 * Get display label for an element.
 * Returns user-defined label if set, otherwise falls back to #serialNumber.
 */
export function getDisplayLabel(element: EditorElement): string {
	return element.label || `#${element.serialNumber}`;
}
