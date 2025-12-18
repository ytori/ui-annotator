import { useEffect } from "react";
import {
	redoAnnotation as redo,
	undoAnnotation as undo,
	useAnnotationStore,
} from "../store";

export function useKeyboardShortcuts() {
	const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
	const deleteSelectedElements = useAnnotationStore(
		(state) => state.deleteSelectedElements,
	);
	const copySelectedElements = useAnnotationStore(
		(state) => state.copySelectedElements,
	);
	const pasteElements = useAnnotationStore((state) => state.pasteElements);
	const selectedIds = useAnnotationStore(
		(state) => state.selection.selectedIds,
	);
	const hasClipboardElements = useAnnotationStore(
		(state) => state.clipboard.elements.length > 0,
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in input
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.tagName === "SELECT" ||
				target.isContentEditable
			) {
				return;
			}

			// Undo/Redo (works everywhere)
			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				e.preventDefault();
				if (e.shiftKey) {
					redo();
				} else {
					undo();
				}
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "y") {
				e.preventDefault();
				redo();
				return;
			}

			// Copy (Ctrl/Cmd + C)
			if ((e.ctrlKey || e.metaKey) && e.key === "c") {
				if (selectedIds.length > 0) {
					e.preventDefault();
					copySelectedElements();
				}
				return;
			}

			// Paste (Ctrl/Cmd + V)
			if ((e.ctrlKey || e.metaKey) && e.key === "v") {
				if (hasClipboardElements) {
					e.preventDefault();
					pasteElements();
				}
				return;
			}

			// Tool shortcuts
			switch (e.key.toLowerCase()) {
				case "v":
					e.preventDefault();
					setActiveTool("edit");
					break;
				case "h":
					e.preventDefault();
					setActiveTool("pan");
					break;
				case "delete":
				case "backspace":
					if (selectedIds.length > 0) {
						e.preventDefault();
						deleteSelectedElements();
					}
					break;
			}
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
