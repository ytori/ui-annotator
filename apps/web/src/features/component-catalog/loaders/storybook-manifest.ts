/**
 * Storybook Manifest Loader (manifests/components.json format)
 *
 * Format:
 * {
 *   "v": 1,
 *   "components": {
 *     "button": { "id": "button", "name": "Button", ... }
 *   }
 * }
 */

import type { ManifestLoader } from "./types";
import { inferCategory, inferIcon } from "./utils";

interface StorybookComponent {
	id: string;
	name: string;
	path?: string;
	import?: string;
	description?: string;
}

interface StorybookManifest {
	v: number;
	components: Record<string, StorybookComponent>;
}

function isStorybookManifest(json: unknown): json is StorybookManifest {
	if (typeof json !== "object" || json === null) return false;
	const obj = json as Record<string, unknown>;
	return (
		typeof obj.v === "number" &&
		typeof obj.components === "object" &&
		obj.components !== null
	);
}

export const storybookManifestLoader: ManifestLoader = {
	id: "storybook-manifest",
	name: "Storybook Manifest",
	fileExtension: ".json",

	canHandle: isStorybookManifest,

	parse: (json) => {
		if (!isStorybookManifest(json)) {
			throw new Error("Invalid Storybook manifest");
		}

		return Object.values(json.components).map((comp) => ({
			name: comp.name,
			icon: inferIcon(comp.name),
			category: inferCategory(comp.id, comp.name),
			description: comp.description || comp.name,
			importStatement: comp.import,
		}));
	},
};
