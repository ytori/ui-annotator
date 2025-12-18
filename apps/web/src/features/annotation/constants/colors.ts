/**
 * Color Configuration
 *
 * Color constants and utilities for canvas rendering and UI.
 */

import { ELEMENT_COLOR_VALUES, type ElementColor } from "@/types";

// ============================================
// RGB Color Types (Canvas Rendering)
// ============================================

/** RGB color type */
export interface RGBColor {
	r: number;
	g: number;
	b: number;
}

/** Primary colors for canvas rendering */
export const primaryColors = {
	/** Primary blue color (Tailwind blue-500) */
	primary: { r: 59, g: 130, b: 246 } as RGBColor,
	/** Guideline pink color (Tailwind pink-500) */
	guideline: { r: 236, g: 72, b: 153 } as RGBColor,
} as const;

/**
 * Element color RGB values for canvas rendering.
 * Matches Tailwind color palette (500 variants).
 * Used in Konva canvas where CSS variables are not available.
 */
export const elementColorRgb: Record<string, RGBColor> = {
	blue: { r: 59, g: 130, b: 246 },
	sky: { r: 56, g: 189, b: 248 },
	cyan: { r: 34, g: 211, b: 238 },
	teal: { r: 45, g: 212, b: 191 },
	green: { r: 74, g: 222, b: 128 },
	lime: { r: 163, g: 230, b: 53 },
	yellow: { r: 250, g: 204, b: 21 },
	amber: { r: 251, g: 191, b: 36 },
	orange: { r: 251, g: 146, b: 60 },
	red: { r: 248, g: 113, b: 113 },
	rose: { r: 251, g: 113, b: 133 },
	pink: { r: 244, g: 114, b: 182 },
	fuchsia: { r: 232, g: 121, b: 249 },
	purple: { r: 192, g: 132, b: 252 },
	violet: { r: 167, g: 139, b: 250 },
	indigo: { r: 129, g: 140, b: 248 },
	slate: { r: 148, g: 163, b: 184 },
	gray: { r: 156, g: 163, b: 175 },
} as const;

/** Default element color */
export const defaultElementColorRgb = elementColorRgb.blue;

/** Get RGB string from color object */
export function colorToRgb(color: RGBColor): string {
	return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/** Get RGBA string from color object */
export function colorToRgba(color: RGBColor, alpha: number): string {
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/** Get element RGB color by name, with fallback to default */
export function getElementRgb(colorName?: string): RGBColor {
	if (colorName && colorName in elementColorRgb) {
		return elementColorRgb[colorName];
	}
	return defaultElementColorRgb;
}

// ============================================
// Element Color UI Configuration
// ============================================

/** Element color configuration for UI display */
export interface ElementColorConfig {
	id: ElementColor;
	label: string;
	/** CSS variable reference, e.g., "var(--element-blue)" */
	cssVar: string;
}

/** All element colors with UI display configuration */
export const ELEMENT_COLORS: ElementColorConfig[] = ELEMENT_COLOR_VALUES.map(
	(id) => ({
		id,
		label: id.charAt(0).toUpperCase() + id.slice(1),
		cssVar: `var(--element-${id})`,
	}),
);

/** Get element color configuration by color name */
export function getElementColorConfig(
	color?: ElementColor,
): ElementColorConfig {
	const found = ELEMENT_COLORS.find((c) => c.id === color);
	if (found) return found;
	return ELEMENT_COLORS[0];
}
