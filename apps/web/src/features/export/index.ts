/**
 * Export Feature
 *
 * Provides export functionality for annotation data.
 * Supports multiple formats: Prompt, JSON.
 */

import { jsonExporter } from "./plugins/json-exporter";
import { promptExporter } from "./plugins/prompt-exporter";
import { exportPluginManager } from "./services/plugin-manager";
import type { ExportInput, ExportOptions } from "./types";

// Register built-in plugins
exportPluginManager.register(promptExporter);
exportPluginManager.register(jsonExporter);

// ============================================
// Public API
// ============================================

/**
 * Download data in a specific format.
 */
export function downloadData(
  formatId: string,
  input: ExportInput,
  options?: ExportOptions
): Promise<void> {
  return exportPluginManager.download(formatId, input, options);
}

export { ExportDialog } from "./components/export-dialog";
export type { ExportInput } from "./types";
