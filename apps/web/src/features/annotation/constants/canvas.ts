/**
 * Canvas Configuration
 *
 * Canvas-related constants for the annotation editor.
 */

export const canvasConfig = {
  /** Minimum annotation size in pixels */
  minAnnotationSize: 10,
  /** Zoom factor for zoom in/out */
  zoomFactor: 1.2,
  /** Minimum zoom scale */
  minScale: 0.1,
  /** Maximum zoom scale */
  maxScale: 5,
  /** Default zoom scale */
  defaultScale: 1,
  /** Fit to screen padding factor */
  fitPadding: 0.9,
} as const;

export const snapConfig: {
  threshold: number;
} = {
  /** Default snap threshold in pixels */
  threshold: 8,
};

export const labelConfig = {
  /** Label font size in pixels */
  fontSize: 11,
  /** Label padding in pixels */
  padding: 4,
  /** Label height (fontSize + padding * 2) */
  height: 11 + 4 * 2,
  /** Gap between label and bounding box border */
  gap: 3,
  /** Maximum label width */
  maxWidth: 200,
} as const;
