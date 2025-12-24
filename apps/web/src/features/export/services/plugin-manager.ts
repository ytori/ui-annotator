import type {
  ExporterPlugin,
  ExportInput,
  ExportOptions,
  ExportResult,
  PluginRegistryEntry,
  ValidationResult,
} from "../types";
import { toExportData } from "./converter";

/**
 * Manages export plugins registration and execution.
 * Provides a centralized way to register, retrieve, and use export plugins.
 */
class ExportPluginManager {
  private readonly plugins: Map<string, PluginRegistryEntry> = new Map();

  /**
   * Register an exporter plugin.
   * @param plugin - The plugin to register
   * @param enabled - Whether the plugin is enabled (default: true)
   */
  register(plugin: ExporterPlugin, enabled = true): void {
    if (this.plugins.has(plugin.meta.id)) {
      console.warn(
        `Plugin "${plugin.meta.id}" is already registered. Overwriting.`
      );
    }
    this.plugins.set(plugin.meta.id, { plugin, enabled });
  }

  /**
   * Unregister an exporter plugin.
   * @param pluginId - The ID of the plugin to unregister
   * @returns true if the plugin was unregistered, false if not found
   */
  unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }

  /**
   * Get a plugin by its ID.
   * @param pluginId - The ID of the plugin to retrieve
   * @returns The plugin if found and enabled, undefined otherwise
   */
  getPlugin(pluginId: string): ExporterPlugin | undefined {
    const entry = this.plugins.get(pluginId);
    return entry?.enabled ? entry.plugin : undefined;
  }

  /**
   * Get all registered and enabled plugins.
   * @returns Array of enabled plugins
   */
  getPlugins(): ExporterPlugin[] {
    return Array.from(this.plugins.values())
      .filter((entry) => entry.enabled)
      .map((entry) => entry.plugin);
  }

  /**
   * Get all registered plugins including disabled ones.
   * @returns Array of all plugins with their enabled status
   */
  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Enable or disable a plugin.
   * @param pluginId - The ID of the plugin
   * @param enabled - Whether to enable the plugin
   * @returns true if the plugin was found, false otherwise
   */
  setEnabled(pluginId: string, enabled: boolean): boolean {
    const entry = this.plugins.get(pluginId);
    if (entry) {
      entry.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Validate export input using a specific plugin.
   * @param pluginId - The ID of the plugin to use
   * @param input - The export input to validate
   * @returns Validation result
   */
  validate(pluginId: string, input: ExportInput): ValidationResult {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return {
        isValid: false,
        invalidElementIds: [],
        errors: [`Plugin "${pluginId}" not found or disabled`],
        warnings: [],
      };
    }
    const data = toExportData(input);
    return plugin.validate(data);
  }

  /**
   * Export using a specific plugin.
   * @param pluginId - The ID of the plugin to use
   * @param input - The export input
   * @param options - Optional export configuration
   * @returns Export result with optional validation warnings
   */
  async export(
    pluginId: string,
    input: ExportInput,
    options?: ExportOptions
  ): Promise<ExportResult & { warnings?: string[] }> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin "${pluginId}" not found or disabled`,
        filename: "error.txt",
        mimeType: "text/plain",
      };
    }

    const data = toExportData(input);

    // Validate before export (warnings only, no blocking)
    const validation = plugin.validate(data);

    const result = await plugin.export(data, options);

    // Attach warnings to result if any
    if (validation.warnings.length > 0) {
      return { ...result, warnings: validation.warnings };
    }

    return result;
  }

  /**
   * Download export in a specific format.
   * @param pluginId - The ID of the plugin to use
   * @param input - The export input
   * @param options - Optional export configuration
   */
  async download(
    pluginId: string,
    input: ExportInput,
    options?: ExportOptions
  ): Promise<void> {
    const result = await this.export(pluginId, input, options);

    if (!(result.success && result.content)) {
      throw new Error(result.error ?? "Export failed");
    }

    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);

    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Clear all registered plugins.
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * Singleton instance of the export plugin manager.
 */
export const exportPluginManager = new ExportPluginManager();
