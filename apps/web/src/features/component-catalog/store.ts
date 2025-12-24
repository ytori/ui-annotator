/**
 * Component Catalog Store
 *
 * Single store for all component sources (builtin + imported).
 */

import type { LucideIcon } from "lucide-react";
import { Box } from "lucide-react";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  findLoader,
  getBuiltinComponents,
  getLoaderById,
  parseManifest,
} from "./loaders";
import {
  CATEGORY_ORDER,
  type UIComponentCategory,
  type UIComponentSuggestion,
} from "./types";

const STORAGE_KEY = "ui-annotator-component-sources";

/**
 * Predefined label colors for imported sources.
 * Uses Tailwind CSS palette colors (hex values required for inline styles).
 */
const LABEL_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#14b8a6", // teal-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
];

/**
 * Stored source data (serializable)
 */
interface StoredSourceData {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  /** Loader ID used to parse this manifest */
  loaderId: string;
  /** Raw manifest data (JSON-serializable) */
  manifest: unknown;
  /** Parse error message (if any) */
  parseError?: string;
}

/**
 * Component source for display
 */
export interface ComponentSource {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  isBuiltin: boolean;
  components: UIComponentSuggestion[];
  /** Parse error message (if any) */
  parseError?: string;
}

/**
 * Source group for display
 */
export interface SourceGroup {
  id: string;
  name: string;
  color: string;
  categories: {
    category: UIComponentCategory;
    components: UIComponentSuggestion[];
  }[];
}

function generateId(): string {
  return `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateColor(): string {
  return LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
}

function groupByCategory(
  components: UIComponentSuggestion[]
): { category: UIComponentCategory; components: UIComponentSuggestion[] }[] {
  const byCategory = new Map<UIComponentCategory, UIComponentSuggestion[]>();
  for (const comp of components) {
    const existing = byCategory.get(comp.category) ?? [];
    existing.push(comp);
    byCategory.set(comp.category, existing);
  }
  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => ({
    category: cat,
    components: byCategory.get(cat) ?? [],
  }));
}

/**
 * Cache for parsed components to avoid re-parsing on every render
 */
interface LoadResult {
  components: UIComponentSuggestion[];
  error?: string;
}
const componentCache = new WeakMap<object, LoadResult>();

/** Check if manifest is a cacheable object */
function isCacheableManifest(manifest: unknown): manifest is object {
  return manifest !== null && typeof manifest === "object";
}

/** Get cached result or null */
function getCachedResult(manifest: unknown): LoadResult | null {
  if (isCacheableManifest(manifest)) {
    return componentCache.get(manifest) ?? null;
  }
  return null;
}

/** Cache a result if manifest is cacheable */
function cacheResult(manifest: unknown, result: LoadResult): void {
  if (isCacheableManifest(manifest)) {
    componentCache.set(manifest, result);
  }
}

/** Resolve loader for a source */
function resolveLoader(source: StoredSourceData) {
  return getLoaderById(source.loaderId) ?? findLoader(source.manifest);
}

/**
 * Load components from a stored source using the appropriate loader
 */
function loadSourceComponents(source: StoredSourceData): LoadResult {
  // Check cache first
  const cached = getCachedResult(source.manifest);
  if (cached) {
    return cached;
  }

  // Resolve loader
  const loader = resolveLoader(source);
  if (!loader) {
    const error = `No loader found for format (loaderId: ${source.loaderId})`;
    console.warn(`[ComponentCatalog] ${error}`);
    const result: LoadResult = { components: [], error };
    cacheResult(source.manifest, result);
    return result;
  }

  // Parse manifest
  try {
    const components = loader.parse(source.manifest);
    const result: LoadResult = { components };
    cacheResult(source.manifest, result);
    return result;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to parse manifest";
    console.error(`[ComponentCatalog] ${error}:`, e);
    const result: LoadResult = { components: [], error };
    cacheResult(source.manifest, result);
    return result;
  }
}

// Builtin source constants
const BUILTIN_ID = "builtin";
const BUILTIN_NAME = "Built-in";
const BUILTIN_COLOR = "#6b7280"; // gray-500

/**
 * Store state
 */
interface ComponentCatalogState {
  importedSources: StoredSourceData[];
  builtinEnabled: boolean;
}

/**
 * Store actions
 */
interface ComponentCatalogActions {
  /** Import a manifest (auto-detects format) */
  importManifest: (name: string, jsonString: string) => string;
  /** Remove a source */
  removeSource: (sourceId: string) => void;
  /** Toggle source enabled state */
  toggleSource: (sourceId: string, enabled: boolean) => void;
  /** Update source name */
  updateSourceName: (sourceId: string, name: string) => void;
  /** Get all components */
  getComponents: () => UIComponentSuggestion[];
  /** Get component by name */
  getComponentByName: (name: string) => UIComponentSuggestion | undefined;
  /** Get component icon */
  getComponentIcon: (name: string | undefined) => LucideIcon;
}

type ComponentCatalogStore = ComponentCatalogState & ComponentCatalogActions;

export const useComponentCatalogStore = create<ComponentCatalogStore>()(
  persist(
    (set, get) => ({
      importedSources: [],
      builtinEnabled: true,

      importManifest: (name, jsonString) => {
        const json = JSON.parse(jsonString);
        const { loaderId } = parseManifest(json);
        const sourceId = generateId();

        const source: StoredSourceData = {
          id: sourceId,
          name,
          color: generateColor(),
          enabled: true,
          loaderId,
          manifest: json,
        };

        set((state) => ({
          importedSources: [...state.importedSources, source],
        }));

        return sourceId;
      },

      removeSource: (sourceId) => {
        // Clear cache for the removed source's manifest
        const source = get().importedSources.find((s) => s.id === sourceId);
        if (source?.manifest && typeof source.manifest === "object") {
          componentCache.delete(source.manifest as object);
        }

        set((state) => ({
          importedSources: state.importedSources.filter(
            (s) => s.id !== sourceId
          ),
        }));
      },

      toggleSource: (sourceId, enabled) => {
        if (sourceId === BUILTIN_ID) {
          set({ builtinEnabled: enabled });
          return;
        }
        set((state) => ({
          importedSources: state.importedSources.map((s) =>
            s.id === sourceId ? { ...s, enabled } : s
          ),
        }));
      },

      updateSourceName: (sourceId, name) => {
        if (!name.trim() || sourceId === BUILTIN_ID) {
          return;
        }
        set((state) => ({
          importedSources: state.importedSources.map((s) =>
            s.id === sourceId ? { ...s, name: name.trim() } : s
          ),
        }));
      },

      getComponents: () => {
        const state = get();
        const components: UIComponentSuggestion[] = [];

        // Add imported components
        for (const source of state.importedSources) {
          if (source.enabled) {
            const result = loadSourceComponents(source);
            components.push(...result.components);
          }
        }

        // Add builtin components
        if (state.builtinEnabled) {
          components.push(...getBuiltinComponents());
        }

        return components;
      },

      getComponentByName: (name) => {
        const lowerName = name.toLowerCase();
        return get()
          .getComponents()
          .find((c) => c.name.toLowerCase() === lowerName);
      },

      getComponentIcon: (name) => {
        if (!name) {
          return Box;
        }
        return get().getComponentByName(name)?.icon ?? Box;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        importedSources: state.importedSources,
        builtinEnabled: state.builtinEnabled,
      }),
    }
  )
);

/**
 * Hook to get source groups (computed from raw state)
 */
export function useSourceGroups(): SourceGroup[] {
  const importedSources = useComponentCatalogStore((s) => s.importedSources);
  const builtinEnabled = useComponentCatalogStore((s) => s.builtinEnabled);

  return useMemo(() => {
    const result: SourceGroup[] = [];

    // Add imported sources first (newest first)
    const enabledImported = [...importedSources]
      .filter((s) => s.enabled)
      .reverse();

    for (const source of enabledImported) {
      const { components } = loadSourceComponents(source);
      if (components.length === 0) {
        continue;
      }

      result.push({
        id: source.id,
        name: source.name,
        color: source.color,
        categories: groupByCategory(components),
      });
    }

    // Add builtin source last
    const builtinComponents = getBuiltinComponents();
    if (builtinEnabled && builtinComponents.length > 0) {
      result.push({
        id: BUILTIN_ID,
        name: BUILTIN_NAME,
        color: BUILTIN_COLOR,
        categories: groupByCategory(builtinComponents),
      });
    }

    return result;
  }, [importedSources, builtinEnabled]);
}

/**
 * Hook to get all sources for management UI
 * Order: imported sources first (newest first), then builtin last
 */
export function useSources(): ComponentSource[] {
  const importedSources = useComponentCatalogStore((s) => s.importedSources);
  const builtinEnabled = useComponentCatalogStore((s) => s.builtinEnabled);

  return useMemo(() => {
    const result: ComponentSource[] = [];

    // Imported sources first (newest first = reversed)
    for (const source of [...importedSources].reverse()) {
      const { components, error } = loadSourceComponents(source);
      result.push({
        id: source.id,
        name: source.name,
        color: source.color,
        enabled: source.enabled,
        isBuiltin: false,
        components,
        parseError: error,
      });
    }

    // Builtin source last
    result.push({
      id: BUILTIN_ID,
      name: BUILTIN_NAME,
      color: BUILTIN_COLOR,
      enabled: builtinEnabled,
      isBuiltin: true,
      components: getBuiltinComponents(),
    });

    return result;
  }, [importedSources, builtinEnabled]);
}

// Convenience functions for non-React contexts
export const getComponentIcon = (name: string | undefined) =>
  useComponentCatalogStore.getState().getComponentIcon(name);

const _getComponentByName = (name: string) =>
  useComponentCatalogStore.getState().getComponentByName(name);
