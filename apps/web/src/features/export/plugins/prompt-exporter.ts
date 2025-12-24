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
 * Row tolerance for sorting (3% of screen height).
 * Elements within this vertical distance are considered on the same row.
 */
const ROW_TOLERANCE_NORM = 0.03;

/**
 * Sort elements top-to-bottom, left-to-right.
 */
function sortElementsByPosition(
  elements: ExportData["elements"]
): ExportData["elements"] {
  return [...elements].sort((a, b) => {
    // Primary: top to bottom (by normalized y)
    const yDiffNorm = a.boundsNorm.y - b.boundsNorm.y;
    // Allow some tolerance for elements on the same "row"
    if (Math.abs(yDiffNorm) > ROW_TOLERANCE_NORM) {
      return yDiffNorm;
    }
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

// ============================================
// Prompt Section Builders
// ============================================

/** Build the header and important notice section */
function buildHeaderSection(): string[] {
  return [
    "# UI Implementation Request",
    "",
    "Implement the following UI based on the attached screenshot. Each element is defined with its bounding box and selected component type.",
    "",
    "> **Important**:",
    "> - This task requires the original screenshot image.",
    "> - If you cannot access the image, ask the user to provide the screenshot file (or its path) corresponding to the filename below before proceeding.",
    "> - Use the component library available in the repository (e.g. shadcn/ui, MUI, or custom `/components` directory).",
    "> - If the component library is unclear, ask the user which library to use before proceeding.",
    "",
  ];
}

/** Build the screen info section */
function buildScreenSection(screen: ExportData["screen"]): string[] {
  const lines = ["## Screen", "", `- Filename: ${screen.sourceFileName}`];
  if (screen.description) {
    lines.push(`- Description: ${screen.description}`);
  }
  lines.push(`- Size: ${screen.size.w} x ${screen.size.h} px`);
  lines.push("");
  return lines;
}

/** Build the rules section */
function buildRulesSection(): string[] {
  return [
    "## Rules",
    "",
    "### Layout",
    "- Use each element's `boundsNorm` / `bounds` as **layout hints**.",
    "- Prefer semantic layout (flex/grid) that matches the screenshot.",
    "- **Do not hardcode absolute positioning** unless it is clearly required by the screenshot.",
    "",
    "### Components",
    "- Use the specified `component` **exactly** for each element.",
    "- If an exact match is unavailable, use a similar component that fulfills the same purpose.",
    "",
    "### Unclear Requirements",
    "- If any detail is unclear, add `TODO:` comments instead of guessing.",
    "",
  ];
}

/** Format notes field (handles multiline) */
function formatNotes(notes: string): string[] {
  if (notes.includes("\n")) {
    const lines = ["- notes: |"];
    for (const line of notes.split("\n")) {
      lines.push(`    ${line}`);
    }
    return lines;
  }
  return [`- notes: ${notes}`];
}

/** Build a single element section */
function buildElementSection(
  element: ExportData["elements"][number]
): string[] {
  const lines = [`### ${element.label}`, `- id: \`${element.id}\``];

  if (element.component?.name) {
    lines.push(`- component: ${element.component.name}`);
  }

  lines.push(
    `- bounds (px): x=${element.bounds.x}, y=${element.bounds.y}, w=${element.bounds.w}, h=${element.bounds.h}`
  );
  lines.push(
    `- bounds (norm): x=${formatNorm(element.boundsNorm.x)}, y=${formatNorm(element.boundsNorm.y)}, w=${formatNorm(element.boundsNorm.w)}, h=${formatNorm(element.boundsNorm.h)}`
  );

  if (element.notes) {
    lines.push(...formatNotes(element.notes));
  }

  lines.push("");
  return lines;
}

/** Build the elements section */
function buildElementsSection(elements: ExportData["elements"]): string[] {
  const lines = ["## Elements (top-to-bottom, left-to-right)", ""];

  if (elements.length === 0) {
    lines.push("_No elements annotated._");
    return lines;
  }

  const sortedElements = sortElementsByPosition(elements);
  for (const element of sortedElements) {
    lines.push(...buildElementSection(element));
  }

  return lines;
}

/**
 * Format export data as an AI-ready prompt.
 * Designed for direct use with Claude Code and similar tools.
 */
function formatAsPrompt(data: ExportData): string {
  return [
    ...buildHeaderSection(),
    ...buildScreenSection(data.screen),
    ...buildRulesSection(),
    ...buildElementsSection(data.elements),
  ].join("\n");
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
      const content = formatAsPrompt(data);
      const baseName = data.screen.sourceFileName.replace(
        FILE_EXTENSION_REGEX,
        ""
      );
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
