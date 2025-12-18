import type {
	ExportData,
	ExporterMeta,
	ExporterPlugin,
	ExportOptions,
	ExportResult,
	ValidationResult,
} from "../types";

/**
 * Row tolerance for sorting (3% of screen height).
 * Elements within this vertical distance are considered on the same row.
 */
const ROW_TOLERANCE_NORM = 0.03;

/**
 * Sort elements top-to-bottom, left-to-right.
 */
function sortElementsByPosition(
	elements: ExportData["elements"],
): ExportData["elements"] {
	return [...elements].sort((a, b) => {
		// Primary: top to bottom (by normalized y)
		const yDiffNorm = a.boundsNorm.y - b.boundsNorm.y;
		// Allow some tolerance for elements on the same "row"
		if (Math.abs(yDiffNorm) > ROW_TOLERANCE_NORM) return yDiffNorm;
		// Secondary: left to right (by normalized x)
		return a.boundsNorm.x - b.boundsNorm.x;
	});
}

/**
 * Format normalized value to 6 decimal places.
 */
function formatNorm(value: number): string {
	return value.toFixed(6);
}

/**
 * Format export data as an AI-ready prompt.
 * Designed for direct use with Claude Code and similar tools.
 */
function formatAsPrompt(data: ExportData): string {
	const lines: string[] = [];

	// Header
	lines.push("# UI Implementation Request");
	lines.push("");
	lines.push(
		"Implement the following UI based on the attached screenshot. Each element is defined with its bounding box and selected component type.",
	);
	lines.push("");

	// Important notice
	lines.push("> **Important**:");
	lines.push("> - This task requires the original screenshot image.");
	lines.push(
		"> - If you cannot access the image, ask the user to provide the screenshot file (or its path) corresponding to the filename below before proceeding.",
	);
	lines.push(
		"> - Use the component library available in the repository (e.g. shadcn/ui, MUI, or custom `/components` directory).",
	);
	lines.push(
		"> - If the component library is unclear, ask the user which library to use before proceeding.",
	);
	lines.push("");

	// Screen info
	lines.push("## Screen");
	lines.push("");
	lines.push(`- Filename: ${data.screen.sourceFileName}`);
	if (data.screen.description) {
		lines.push(`- Description: ${data.screen.description}`);
	}
	lines.push(`- Size: ${data.screen.size.w} x ${data.screen.size.h} px`);
	lines.push("");

	// Rules section
	lines.push("## Rules");
	lines.push("");
	lines.push("### Layout");
	lines.push(
		"- Use each element's `boundsNorm` / `bounds` as **layout hints**.",
	);
	lines.push(
		"- Prefer semantic layout (flex/grid) that matches the screenshot.",
	);
	lines.push(
		"- **Do not hardcode absolute positioning** unless it is clearly required by the screenshot.",
	);
	lines.push("");
	lines.push("### Components");
	lines.push("- Use the specified `component` **exactly** for each element.");
	lines.push(
		"- If an exact match is unavailable, use a similar component that fulfills the same purpose.",
	);
	lines.push("");
	lines.push("### Unclear Requirements");
	lines.push(
		"- If any detail is unclear, add `TODO:` comments instead of guessing.",
	);
	lines.push("");

	// Elements
	lines.push("## Elements (top-to-bottom, left-to-right)");
	lines.push("");

	if (data.elements.length === 0) {
		lines.push("_No elements annotated._");
	} else {
		const sortedElements = sortElementsByPosition(data.elements);

		for (const element of sortedElements) {
			lines.push(`### ${element.label}`);
			lines.push(`- id: \`${element.id}\``);
			if (element.component?.name) {
				lines.push(`- component: ${element.component.name}`);
			}
			lines.push(
				`- bounds (px): x=${element.bounds.x}, y=${element.bounds.y}, w=${element.bounds.w}, h=${element.bounds.h}`,
			);
			lines.push(
				`- bounds (norm): x=${formatNorm(element.boundsNorm.x)}, y=${formatNorm(element.boundsNorm.y)}, w=${formatNorm(element.boundsNorm.w)}, h=${formatNorm(element.boundsNorm.h)}`,
			);
			if (element.notes) {
				if (element.notes.includes("\n")) {
					lines.push("- notes: |");
					for (const line of element.notes.split("\n")) {
						lines.push(`    ${line}`);
					}
				} else {
					lines.push(`- notes: ${element.notes}`);
				}
			}
			lines.push("");
		}
	}

	return lines.join("\n");
}

/**
 * Prompt Exporter Plugin.
 * Exports annotation data as a formatted AI prompt.
 */
export const promptExporter: ExporterPlugin = {
	meta: {
		id: "prompt",
		name: "AI Prompt",
		description: "Formatted prompt for AI agents like Claude Code",
		fileExtension: "md",
		mimeType: "text/markdown",
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
				warnings.push(`Element is missing a label`);
			}
		}

		return {
			isValid: true, // Labels are optional - always valid
			invalidElementIds,
			errors: [],
			warnings,
		};
	},

	async export(
		data: ExportData,
		options?: ExportOptions,
	): Promise<ExportResult> {
		try {
			const content = formatAsPrompt(data);
			const baseName = data.screen.sourceFileName.replace(/\.[^.]+$/, "");
			const filename = options?.filename ?? `${baseName}-prompt`;

			return {
				success: true,
				content,
				filename: `${filename}.md`,
				mimeType: this.meta.mimeType,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				filename: "error.md",
				mimeType: this.meta.mimeType,
			};
		}
	},
};
