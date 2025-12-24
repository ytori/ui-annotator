import { useCallback, useMemo } from "react";

// File System Access API types (not yet in standard lib)
declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

import {
  selectElements,
  selectProject,
  useAnnotationStore,
} from "@/features/annotation";
import { downloadData, type ExportInput } from "@/features/export";
import { openFile, saveProjectFile } from "@/features/storage";
import { showError, showSuccess } from "@/lib/error";
import { toElements } from "@/types";

/**
 * Hook that integrates toolbar actions from multiple features
 *
 * This hook provides a unified interface for:
 * - Storage operations (Open/Save project files)
 * - Export operations (from export feature)
 *
 * Used to inject handlers into AnnotatorToolbar without the annotation
 * feature depending on other features.
 */
export function useToolbarActions() {
  const project = useAnnotationStore(selectProject);
  const elements = useAnnotationStore(selectElements);
  const loadProject = useAnnotationStore((state) => state.loadProject);

  // Convert editor elements to export input format
  const exportInput = useMemo<ExportInput | null>(() => {
    if (!project) {
      return null;
    }
    return {
      name: project.name,
      description: project.description,
      sourceFileName: project.sourceFileName,
      imageWidth: project.imageWidth,
      imageHeight: project.imageHeight,
      elements: toElements(elements),
    };
  }, [project, elements]);

  /**
   * Handle opening an image or project file.
   */
  const handleOpen = useCallback(
    async (file: File) => {
      const result = await openFile(file);

      if (!result.success) {
        showError("Failed to open file", result.error);
        return;
      }

      // Load project with its image (both are ready from openFile)
      loadProject(result.data.project, result.data.image);

      if (result.data.hasEmbeddedData) {
        showSuccess("Project restored", result.data.project.name);
      }
    },
    [loadProject]
  );

  /**
   * Handle saving project to ZIP archive.
   * Uses File System Access API for native save dialog when available.
   */
  const handleSave = useCallback(async () => {
    if (!project) {
      return;
    }

    // Sync elements with project for save
    const projectToSave = {
      ...project,
      elements,
      updatedAt: new Date().toISOString(),
    };

    const result = await saveProjectFile(projectToSave);

    if (!result.success) {
      showError("Save failed", result.error);
      return;
    }

    // Try to use File System Access API for native save dialog
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: result.data.filename,
          types: [
            {
              description: "UI Annotator Project",
              accept: { "application/zip": [".zip"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(result.data.blob);
        await writable.close();
        showSuccess("Project saved", handle.name);
        return;
      } catch (err) {
        // User cancelled or API failed - fall through to download
        if (err instanceof Error && err.name === "AbortError") {
          return; // User cancelled
        }
      }
    }

    // Fallback: download the file
    const url = URL.createObjectURL(result.data.blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(url);
    }

    showSuccess("Project saved", result.data.filename);
  }, [project, elements]);

  /**
   * Handle exporting for AI (JSON format).
   */
  const handleExport = useCallback(async () => {
    if (!(exportInput && project)) {
      return;
    }

    try {
      await downloadData("json", exportInput);
      showSuccess("Export complete", project.name);
    } catch (error) {
      showError(
        "Export failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }, [exportInput, project]);

  return {
    handleOpen,
    handleSave,
    handleExport,
    /** Pre-computed export input from current project state */
    exportInput,
  };
}
