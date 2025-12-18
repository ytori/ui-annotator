import { z } from "zod";
import { componentSpecSchema } from "./component";
import { bboxSchema } from "./geometry";

/**
 * Element Type
 *
 * Core element type representing an annotation.
 * This is the shared domain model used by both annotation and export features.
 * Editor-specific fields (color, displayOrder, etc.) are defined in annotation feature.
 */

export const elementSchema = z.object({
	id: z.string(),
	label: z.string(),
	bbox: bboxSchema,
	component: componentSpecSchema.optional(),
	notes: z.string().optional(),
});

export type Element = z.infer<typeof elementSchema>;

export type ElementId = string;
