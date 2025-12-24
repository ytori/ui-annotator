/**
 * Export Data Converter
 *
 * Converts ExportInput to ExportData format.
 */

import { type Element, VERSIONS } from "@/types";
import type { ExportData, ExportElement } from "../types/export-schema";
import type { ExportInput } from "../types/exporter";

/**
 * Convert an Element to ExportElement format.
 */
function toExportElement(element: Element): ExportElement {
  return {
    id: element.id,
    label: element.label,
    bounds: {
      x: Math.round(element.bbox.pixel.x),
      y: Math.round(element.bbox.pixel.y),
      w: Math.round(element.bbox.pixel.w),
      h: Math.round(element.bbox.pixel.h),
    },
    boundsNorm: {
      x: element.bbox.norm.x,
      y: element.bbox.norm.y,
      w: element.bbox.norm.w,
      h: element.bbox.norm.h,
    },
    ...(element.component && {
      component: {
        name: element.component.name,
      },
    }),
    ...(element.notes && { notes: element.notes }),
  };
}

/**
 * Convert ExportInput to the unified ExportData format.
 * All exporters should use this function to get normalized data.
 */
export function toExportData(input: ExportInput): ExportData {
  return {
    version: VERSIONS.export,
    screen: {
      name: input.name,
      ...(input.description && { description: input.description }),
      sourceFileName: input.sourceFileName,
      size: {
        w: input.imageWidth,
        h: input.imageHeight,
      },
    },
    elements: input.elements.map(toExportElement),
    exportedAt: new Date().toISOString(),
  };
}
