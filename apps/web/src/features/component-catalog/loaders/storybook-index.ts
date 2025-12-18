/**
 * Storybook Index Loader (v5+ index.json format)
 *
 * Format:
 * {
 *   "v": 5,
 *   "entries": {
 *     "components-button--playground": {
 *       "id": "...",
 *       "title": "Components/Button",
 *       "name": "Playground",
 *       "type": "story",
 *       ...
 *     }
 *   }
 * }
 */

import type { ManifestLoader } from "./types";
import { inferCategory, inferIcon } from "./utils";

interface StorybookEntry {
	id: string;
	title: string;
	name: string;
	importPath?: string;
	type: "docs" | "story";
	tags?: string[];
}

interface StorybookIndex {
	v: number;
	entries: Record<string, StorybookEntry>;
}

function isStorybookIndex(json: unknown): json is StorybookIndex {
	if (typeof json !== "object" || json === null) return false;
	const obj = json as Record<string, unknown>;
	return (
		typeof obj.v === "number" &&
		typeof obj.entries === "object" &&
		obj.entries !== null
	);
}

export const storybookIndexLoader: ManifestLoader = {
	id: "storybook-index",
	name: "Storybook Index",
	fileExtension: ".json",

	canHandle: isStorybookIndex,

	parse: (json) => {
		if (!isStorybookIndex(json)) {
			throw new Error("Invalid Storybook index");
		}

		const entries = Object.values(json.entries);

		// Group by component title (e.g., "Components/ボタン")
		const componentMap = new Map<
			string,
			{ title: string; importPath?: string }
		>();

		for (const entry of entries) {
			// Skip docs entries, only process stories
			if (entry.type === "docs") continue;

			const title = entry.title;
			if (!componentMap.has(title)) {
				componentMap.set(title, {
					title,
					importPath: entry.importPath,
				});
			}
		}

		return Array.from(componentMap.values()).map((comp) => {
			// Extract component name from title (e.g., "Components/ボタン" -> "ボタン")
			const parts = comp.title.split("/");
			const name = parts[parts.length - 1];
			const categoryHint = parts.length > 1 ? parts[0] : "";

			return {
				name,
				icon: inferIcon(name),
				category: inferCategory(categoryHint, name),
				description: name,
				importStatement: comp.importPath,
			};
		});
	},
};
