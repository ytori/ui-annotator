/**
 * Manifest Loader Registry
 *
 * Manages loader plugins for different manifest formats.
 */

import { builtinLoader } from "./builtin";
import { storybookIndexLoader } from "./storybook-index";
import { storybookManifestLoader } from "./storybook-manifest";
import type { ManifestLoader } from "./types";

export { getBuiltinComponents } from "./builtin";
export type { ManifestLoader } from "./types";

/**
 * Registered loaders (order matters - first match wins)
 * Builtin loader is last as fallback.
 */
const loaders: ManifestLoader[] = [
	storybookIndexLoader,
	storybookManifestLoader,
	// Add more loaders here:
	// figmaLoader,
	// customLoader,
	builtinLoader, // Builtin last (fallback)
];

/**
 * Register a new loader
 */
function _registerLoader(loader: ManifestLoader): void {
	// Add to beginning so custom loaders take priority
	loaders.unshift(loader);
}

/**
 * Get all registered loaders
 */
function _getLoaders(): ManifestLoader[] {
	return [...loaders];
}

/**
 * Find a loader by its ID
 */
export function getLoaderById(id: string): ManifestLoader | undefined {
	return loaders.find((loader) => loader.id === id);
}

/**
 * Find a loader that can handle the given JSON
 */
export function findLoader(json: unknown): ManifestLoader | undefined {
	return loaders.find((loader) => loader.canHandle(json));
}

/**
 * Parse a manifest using the appropriate loader
 * Throws if no loader can handle the format
 */
export function parseManifest(json: unknown): {
	loaderId: string;
	components: ReturnType<ManifestLoader["parse"]>;
} {
	const loader = findLoader(json);
	if (!loader) {
		throw new Error(
			"Unknown manifest format. Supported formats: " +
				loaders.map((l) => l.name).join(", "),
		);
	}

	return {
		loaderId: loader.id,
		components: loader.parse(json),
	};
}
