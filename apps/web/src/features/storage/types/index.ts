/**
 * Storage Feature Types
 */

import { z } from "zod";
import { type Project, projectSchema, versionsSchema } from "@/types";

// ============================================
// Embedded Project Data Schema
// ============================================

/**
 * Schema for embedded project data (stored in PNG tEXt chunk).
 * Note: imageUrl is excluded as the PNG itself is the image source.
 */
export const embeddedProjectDataSchema = z.object({
	storageVersion: versionsSchema.shape.storage,
	project: projectSchema.omit({ imageUrl: true }),
});

export type EmbeddedProjectData = z.infer<typeof embeddedProjectDataSchema>;

// ============================================
// Open Result
// ============================================

/**
 * Result of opening a PNG file.
 */
export interface OpenResult {
	/** The project data (with imageUrl populated from PNG) */
	project: Project;
	/** The loaded image element (ready for immediate use) */
	image: HTMLImageElement;
	/** Whether the PNG had embedded project data */
	hasEmbeddedData: boolean;
}
