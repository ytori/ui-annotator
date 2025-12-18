import { z } from "zod";

/**
 * Geometry Types
 *
 * Coordinate and bounding box types used across the application.
 */

// ============================================
// Pixel Coordinates
// ============================================

export const pixelCoordSchema = z.object({
	x: z.number(),
	y: z.number(),
	w: z.number().positive(),
	h: z.number().positive(),
});

export type PixelCoord = z.infer<typeof pixelCoordSchema>;

// ============================================
// Normalized Coordinates
// ============================================

export const normCoordSchema = z.object({
	x: z.number(),
	y: z.number(),
	w: z.number(),
	h: z.number(),
});

export type NormCoord = z.infer<typeof normCoordSchema>;

// ============================================
// Bounding Box
// ============================================

export const bboxSchema = z.object({
	pixel: pixelCoordSchema,
	norm: normCoordSchema,
});

export type BBox = z.infer<typeof bboxSchema>;

// ============================================
// Point
// ============================================

/**
 * 2D point coordinate.
 */
export interface Point {
	x: number;
	y: number;
}
