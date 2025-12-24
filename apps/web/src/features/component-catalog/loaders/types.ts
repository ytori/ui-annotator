/**
 * Manifest Loader Plugin Types
 */

import type { UIComponentSuggestion } from "../types";

/**
 * Manifest loader plugin interface
 *
 * Each loader handles a specific manifest format (Storybook, Figma, custom, etc.)
 */
export interface ManifestLoader {
  /** Unique identifier for this loader */
  id: string;

  /** Display name */
  name: string;

  /** File extension hint (for UI) */
  fileExtension?: string;

  /** Check if this loader can handle the given JSON */
  canHandle: (json: unknown) => boolean;

  /** Parse the JSON and return components */
  parse: (json: unknown) => UIComponentSuggestion[];
}
