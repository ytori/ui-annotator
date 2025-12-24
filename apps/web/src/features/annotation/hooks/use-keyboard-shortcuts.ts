import { useEffect } from "react";
import {
  redoAnnotation as redo,
  undoAnnotation as undo,
  useAnnotationStore,
} from "../store";

/** Check if target is an input element that should capture keyboard events */
function isInputElement(target: HTMLElement): boolean {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/** Check if Ctrl (Windows/Linux) or Cmd (Mac) modifier is pressed */
function hasModifierKey(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}

interface ShortcutContext {
  hasSelection: boolean;
  hasClipboard: boolean;
  setActiveTool: (tool: "edit" | "pan") => void;
  deleteSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
}

/** Handle undo/redo shortcuts */
function handleUndoRedo(e: KeyboardEvent): boolean {
  if (!hasModifierKey(e)) {
    return false;
  }

  if (e.key === "z") {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
    return true;
  }

  if (e.key === "y") {
    e.preventDefault();
    redo();
    return true;
  }

  return false;
}

/** Handle copy/paste shortcuts */
function handleCopyPaste(e: KeyboardEvent, ctx: ShortcutContext): boolean {
  if (!hasModifierKey(e)) {
    return false;
  }

  if (e.key === "c" && ctx.hasSelection) {
    e.preventDefault();
    ctx.copySelectedElements();
    return true;
  }

  if (e.key === "v" && ctx.hasClipboard) {
    e.preventDefault();
    ctx.pasteElements();
    return true;
  }

  return false;
}

/** Handle tool and delete shortcuts */
function handleToolShortcuts(e: KeyboardEvent, ctx: ShortcutContext): boolean {
  const key = e.key.toLowerCase();

  if (key === "v") {
    e.preventDefault();
    ctx.setActiveTool("edit");
    return true;
  }

  if (key === "h") {
    e.preventDefault();
    ctx.setActiveTool("pan");
    return true;
  }

  if ((key === "delete" || key === "backspace") && ctx.hasSelection) {
    e.preventDefault();
    ctx.deleteSelectedElements();
    return true;
  }

  return false;
}

export function useKeyboardShortcuts() {
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const deleteSelectedElements = useAnnotationStore(
    (state) => state.deleteSelectedElements
  );
  const copySelectedElements = useAnnotationStore(
    (state) => state.copySelectedElements
  );
  const pasteElements = useAnnotationStore((state) => state.pasteElements);
  const selectedIds = useAnnotationStore(
    (state) => state.selection.selectedIds
  );
  const hasClipboardElements = useAnnotationStore(
    (state) => state.clipboard.elements.length > 0
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (isInputElement(target)) {
        return;
      }

      const ctx: ShortcutContext = {
        hasSelection: selectedIds.length > 0,
        hasClipboard: hasClipboardElements,
        setActiveTool,
        deleteSelectedElements,
        copySelectedElements,
        pasteElements,
      };

      // Process shortcuts in priority order
      if (handleUndoRedo(e)) {
        return;
      }
      if (handleCopyPaste(e, ctx)) {
        return;
      }
      handleToolShortcuts(e, ctx);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setActiveTool,
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
    selectedIds,
    hasClipboardElements,
  ]);
}
