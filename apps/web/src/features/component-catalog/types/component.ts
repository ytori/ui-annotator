import type { LucideIcon } from "lucide-react";

/**
 * Component category
 */
export type UIComponentCategory =
  | "Forms"
  | "Actions"
  | "Layout"
  | "Data Display"
  | "Navigation"
  | "Feedback"
  | "Typography"
  | "Media"
  | "Other";

/**
 * UI Component suggestion for the combobox
 */
export interface UIComponentSuggestion {
  name: string;
  icon: LucideIcon;
  category: UIComponentCategory;
  description: string;
  /** Import statement for the component */
  importStatement?: string;
}

/**
 * Category display order
 */
export const CATEGORY_ORDER: UIComponentCategory[] = [
  "Forms",
  "Actions",
  "Layout",
  "Data Display",
  "Navigation",
  "Feedback",
  "Typography",
  "Media",
  "Other",
];
