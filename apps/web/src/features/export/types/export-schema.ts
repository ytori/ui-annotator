/**
 * Export Schema
 *
 * Unified export format for annotation data.
 * All exporters transform ExportInput → ExportData → format-specific output.
 */

import { z } from "zod";
import { versionsSchema } from "@/types";

// ============================================
// Export Element Schema
// ============================================

/**
 * Bounding box in the export format.
 */
export const exportBboxSchema = z.object({
  /** X coordinate in pixels */
  x: z.number(),
  /** Y coordinate in pixels */
  y: z.number(),
  /** Width in pixels */
  w: z.number(),
  /** Height in pixels */
  h: z.number(),
});

/**
 * Normalized bounding box (0-1 range).
 */
export const exportNormBboxSchema = z.object({
  /** Normalized X (0-1) */
  x: z.number().min(0).max(1),
  /** Normalized Y (0-1) */
  y: z.number().min(0).max(1),
  /** Normalized width (0-1) */
  w: z.number().min(0).max(1),
  /** Normalized height (0-1) */
  h: z.number().min(0).max(1),
});

/**
 * Component specification in export format.
 */
export const exportComponentSchema = z.object({
  /** Component name (e.g., "Button", "Input") */
  name: z.string(),
});

/**
 * Element in the export format.
 * Simplified from internal Element type for clean export.
 */
export const exportElementSchema = z.object({
  /** Unique element identifier */
  id: z.string(),
  /** Human-readable label */
  label: z.string(),
  /** Bounding box in pixels */
  bounds: exportBboxSchema,
  /** Normalized bounding box (0-1) */
  boundsNorm: exportNormBboxSchema,
  /** Component specification */
  component: exportComponentSchema.optional(),
  /** Additional notes */
  notes: z.string().optional(),
});

export type ExportElement = z.infer<typeof exportElementSchema>;

// ============================================
// Export Data Schema
// ============================================

/**
 * Screen information in export format.
 */
export const exportScreenSchema = z.object({
  /** Screen/project name */
  name: z.string(),
  /** Screen description */
  description: z.string().optional(),
  /** Original source file name with extension (e.g., "screenshot.png") */
  sourceFileName: z.string(),
  /** Image dimensions */
  size: z.object({
    w: z.number().positive(),
    h: z.number().positive(),
  }),
});

/**
 * Main export data schema.
 * This is the unified format that all exporters work with.
 */
export const exportDataSchema = z.object({
  /** Schema version for future compatibility */
  version: versionsSchema.shape.export,
  /** Screen information */
  screen: exportScreenSchema,
  /** Annotated elements */
  elements: z.array(exportElementSchema),
  /** Export timestamp */
  exportedAt: z.iso.datetime(),
});

export type ExportData = z.infer<typeof exportDataSchema>;
