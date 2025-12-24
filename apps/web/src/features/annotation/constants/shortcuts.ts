/**
 * Keyboard shortcuts data for the help dialog.
 */

export interface Shortcut {
  /** Windows/Linux keys */
  keys: string[];
  /** Mac-specific keys (optional) */
  macKeys?: string[];
  /** Description of the shortcut */
  description: string;
}

export interface ShortcutGroup {
  /** Group title */
  title: string;
  /** Shortcuts in this group */
  shortcuts: Shortcut[];
}

/**
 * All keyboard shortcuts grouped by category.
 */
export const KEYBOARD_SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Tools",
    shortcuts: [
      { keys: ["V"], description: "Switch to Edit tool" },
      { keys: ["H"], description: "Switch to Pan tool" },
    ],
  },
  {
    title: "Selection & Edit",
    shortcuts: [
      { keys: ["Click"], description: "Select element" },
      {
        keys: ["Double Click"],
        description: "Cycle through overlapping elements",
      },
      { keys: ["Enter"], description: "Start editing label" },
      {
        keys: ["Ctrl", "+", "C"],
        macKeys: ["⌘", "+", "C"],
        description: "Copy selected elements",
      },
      {
        keys: ["Ctrl", "+", "V"],
        macKeys: ["⌘", "+", "V"],
        description: "Paste elements",
      },
      { keys: ["Delete"], description: "Delete selected elements" },
    ],
  },
  {
    title: "Move",
    shortcuts: [
      { keys: ["↑", "↓", "←", "→"], description: "Move selected by 1px" },
      { keys: ["Shift", "+", "Arrow"], description: "Move selected by 10px" },
    ],
  },
  {
    title: "Draw",
    shortcuts: [
      { keys: ["Drag"], description: "Draw new element" },
      {
        keys: ["Alt", "+", "Drag"],
        macKeys: ["Option", "+", "Drag"],
        description: "Draw over existing elements",
      },
    ],
  },
  {
    title: "History",
    shortcuts: [
      {
        keys: ["Ctrl", "+", "Z"],
        macKeys: ["⌘", "+", "Z"],
        description: "Undo",
      },
      {
        keys: ["Ctrl", "+", "Shift", "+", "Z"],
        macKeys: ["⌘", "+", "Shift", "+", "Z"],
        description: "Redo",
      },
    ],
  },
];
