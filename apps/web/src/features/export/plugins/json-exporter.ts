import type {
  ExportData,
  ExporterMeta,
  ExporterPlugin,
  ExportOptions,
  ExportResult,
  ValidationResult,
} from "../types";

/** Regex to remove file extension */
const FILE_EXTENSION_REGEX = /\.[^.]+$/;

/**
 * JSON Exporter Plugin.
 * Exports annotation data in the standard ExportData JSON format.
 */
export const jsonExporter: ExporterPlugin = {
  meta: {
    id: "json",
    name: "JSON",
    description: "Standard JSON format for programmatic use",
    fileExtension: "json",
    mimeType: "application/json",
    supportsClipboard: true,
    supportsDownload: true,
  } satisfies ExporterMeta,

  validate(data: ExportData): ValidationResult {
    const warnings: string[] = [];
    const invalidElementIds: string[] = [];

    if (data.elements.length === 0) {
      warnings.push("No annotations to export");
    }

    for (const element of data.elements) {
      if (!element.label || element.label.trim() === "") {
        invalidElementIds.push(element.id);
        warnings.push("Element is missing a label");
      }
    }

    return {
      isValid: true, // Labels are optional - always valid
      invalidElementIds,
      errors: [],
      warnings,
    };
  },

  export(data: ExportData, options?: ExportOptions): ExportResult {
    try {
      const prettyPrint = options?.prettyPrint ?? true;
      const content = prettyPrint
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      const baseName = data.screen.sourceFileName.replace(
        FILE_EXTENSION_REGEX,
        ""
      );
      const filename = options?.filename ?? `${baseName}-annotations`;

      return {
        success: true,
        content,
        filename: `${filename}.json`,
        mimeType: this.meta.mimeType,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        filename: "error.json",
        mimeType: this.meta.mimeType,
      };
    }
  },
};
