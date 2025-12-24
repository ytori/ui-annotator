import type { Element, ElementId } from "@/types";
import type { ExportData } from "./export-schema";

/**
 * Exporter Plugin Types
 *
 * Types for the export plugin system.
 */

// ============================================
// Export Input (from App Layer)
// ============================================

/**
 * Input for export operations.
 * This is what the app layer provides to the export feature.
 */
export interface ExportInput {
  name: string;
  description?: string;
  /** Original source file name with extension (e.g., "screenshot.png") */
  sourceFileName: string;
  imageWidth: number;
  imageHeight: number;
  elements: Element[];
}

// ============================================
// Plugin Metadata
// ============================================

/**
 * Exporter plugin metadata.
 */
export interface ExporterMeta {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin description */
  description: string;
  /** File extension for downloads (e.g., 'json', 'csv') */
  fileExtension: string;
  /** MIME type for the exported content */
  mimeType: string;
  /** Whether this format supports clipboard copy */
  supportsClipboard?: boolean;
  /** Whether this format supports file download */
  supportsDownload?: boolean;
}

// ============================================
// Export Options
// ============================================

/**
 * Export options that can be passed to exporters.
 */
export interface ExportOptions {
  /** Whether to format output for readability */
  prettyPrint?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** Additional plugin-specific options */
  [key: string]: unknown;
}

// ============================================
// Validation Result
// ============================================

/**
 * Validation result for pre-export checks.
 */
export interface ValidationResult {
  /** Whether all validations passed */
  isValid: boolean;
  /** Element IDs that failed validation */
  invalidElementIds: ElementId[];
  /** Human-readable error messages */
  errors: string[];
  /** Human-readable warning messages */
  warnings: string[];
}

// ============================================
// Export Result
// ============================================

/**
 * Result of an export operation.
 */
export interface ExportResult {
  /** Whether the export succeeded */
  success: boolean;
  /** The exported content as a string */
  content?: string;
  /** Error message if export failed */
  error?: string;
  /** Suggested filename for download */
  filename: string;
  /** MIME type of the exported content */
  mimeType: string;
}

// ============================================
// Exporter Plugin Interface
// ============================================

/**
 * Exporter plugin interface.
 * All export format plugins must implement this interface.
 *
 * Plugins receive ExportData (the unified export format) and produce
 * format-specific output strings.
 */
export interface ExporterPlugin {
  /** Plugin metadata */
  readonly meta: ExporterMeta;

  /**
   * Validate data before export.
   * @param data - The export data to validate
   * @returns Validation result with any errors or warnings
   */
  validate(data: ExportData): ValidationResult;

  /**
   * Export to the plugin's format.
   * @param data - The export data (unified format)
   * @param options - Optional export configuration
   * @returns Export result with content or error
   */
  export(
    data: ExportData,
    options?: ExportOptions
  ): Promise<ExportResult> | ExportResult;
}

// ============================================
// Plugin Registry
// ============================================

/**
 * Registry entry for a plugin.
 */
export interface PluginRegistryEntry {
  plugin: ExporterPlugin;
  enabled: boolean;
}
