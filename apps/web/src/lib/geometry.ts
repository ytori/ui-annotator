/**
 * Geometry utilities for coordinate transformation and BBox operations.
 * These are shared across features (canvas, elements, properties).
 */

import type { BBox, NormCoord, PixelCoord } from "@/types";

export interface ImageSize {
  w: number;
  h: number;
}

/**
 * Convert pixel coordinates to normalized coordinates
 */
export function pixelToNorm(
  pixel: PixelCoord,
  imageSize: ImageSize
): NormCoord {
  return {
    x: pixel.x / imageSize.w,
    y: pixel.y / imageSize.h,
    w: pixel.w / imageSize.w,
    h: pixel.h / imageSize.h,
  };
}

/**
 * Create a BBox from pixel coordinates and image size
 */
export function createBBox(pixel: PixelCoord, imageSize: ImageSize): BBox {
  return {
    pixel,
    norm: pixelToNorm(pixel, imageSize),
  };
}

/**
 * Update BBox pixel coordinates and recalculate norm
 */
export function updateBBoxPixel(
  bbox: BBox,
  pixelUpdate: Partial<PixelCoord>,
  imageSize: ImageSize
): BBox {
  const newPixel = { ...bbox.pixel, ...pixelUpdate };
  return createBBox(newPixel, imageSize);
}

/**
 * Round pixel coordinates to integers for display
 */
export function roundPixel(pixel: PixelCoord): PixelCoord {
  return {
    x: Math.round(pixel.x),
    y: Math.round(pixel.y),
    w: Math.round(pixel.w),
    h: Math.round(pixel.h),
  };
}

/**
 * Format normalized coordinates for display (3 decimal places)
 */
export function formatNorm(norm: NormCoord): {
  x: string;
  y: string;
  w: string;
  h: string;
} {
  return {
    x: norm.x.toFixed(3),
    y: norm.y.toFixed(3),
    w: norm.w.toFixed(3),
    h: norm.h.toFixed(3),
  };
}
