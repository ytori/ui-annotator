/**
 * Element Factory
 *
 * Centralized element creation logic for the elements feature.
 */

import { v4 as uuidv4 } from "uuid";
import type { BBox, ComponentSpec, EditorElement, ElementColor } from "@/types";

/**
 * Options for creating a new element
 */
export interface CreateElementOptions {
	/** Bounding box for the element */
	bbox: BBox;
	/** Existing elements (used for displayOrder and serialNumber generation) */
	existingElements: EditorElement[];
	/** Optional custom label (defaults to empty, display uses serialNumber as fallback) */
	label?: string;
	/** Optional component specification */
	component?: ComponentSpec;
	/** Optional notes */
	notes?: string;
	/** Optional color */
	color?: ElementColor;
}

/**
 * Generates the next serial number.
 * Finds the maximum existing serial number and returns the next one.
 */
function generateSerialNumber(existingElements: EditorElement[]): number {
	if (existingElements.length === 0) return 1;

	const serialNumbers = existingElements
		.map((el) => el.serialNumber)
		.filter((n): n is number => typeof n === "number" && !Number.isNaN(n));

	if (serialNumbers.length === 0) return 1;

	return Math.max(...serialNumbers) + 1;
}

/**
 * Creates a new annotation element with consistent ID generation.
 *
 * This factory function centralizes element creation logic to ensure:
 * - Consistent UUID generation across the application
 * - Auto-assigned serial number (immutable, for display fallback)
 * - Correct displayOrder assignment
 * - Proper timestamp initialization
 *
 * @param options - Element creation options
 * @returns A fully initialized EditorElement
 */
export function createElement(options: CreateElementOptions): EditorElement {
	const { bbox, existingElements, label, component, notes, color } = options;
	const now = new Date().toISOString();

	return {
		id: uuidv4(),
		label: label ?? "",
		bbox,
		serialNumber: generateSerialNumber(existingElements),
		displayOrder: existingElements.length,
		createdAt: now,
		updatedAt: now,
		...(component !== undefined && { component }),
		...(notes !== undefined && { notes }),
		...(color !== undefined && { color }),
	};
}
