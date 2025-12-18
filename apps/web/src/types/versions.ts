import { z } from "zod";

/**
 * Version Definitions (Source of Truth)
 *
 * All version constants for storage and export formats.
 * Centralized here for consistency and easy management.
 */

// ============================================
// Version Constants
// ============================================

export const VERSIONS = {
	storage: "0.0.1",
	export: "0.0.1",
} as const;

// ============================================
// Version Schema
// ============================================

export const versionsSchema = z.object({
	/** Storage format version (PNG embedding) */
	storage: z.literal(VERSIONS.storage),
	/** Export schema version (JSON/Prompt output) */
	export: z.literal(VERSIONS.export),
});
