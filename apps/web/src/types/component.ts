import { z } from "zod";

/**
 * Component Specification
 *
 * Describes a UI component for annotation elements.
 */

/**
 * Component name validation: 1-100 characters
 */
export const componentNameSchema = z
	.string()
	.min(1, "Component name is required")
	.max(100, "Component name is too long");

/**
 * Component specification schema for runtime validation.
 * Uses z.unknown() for props values to allow any JSON-serializable data.
 */
export const componentSpecSchema = z.object({
	name: componentNameSchema,
	props: z.record(z.string(), z.unknown()).optional(),
});

export type ComponentSpec = z.infer<typeof componentSpecSchema>;
