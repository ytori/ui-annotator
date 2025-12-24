import { z } from "zod";
import { editorElementSchema } from "./editor-element";

/**
 * Project Types
 *
 * Project schema for saving and restoring editor state.
 * Shared across annotation and storage features.
 */

// ============================================
// Project Schema
// ============================================

/**
 * Project schema for runtime validation.
 */
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Original source file name (e.g., "screenshot.png") */
  sourceFileName: z.string(),
  imageUrl: z.string(),
  imageWidth: z.number().positive(),
  imageHeight: z.number().positive(),
  elements: z.array(editorElementSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;
