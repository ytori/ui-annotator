/**
 * Project Serializer
 *
 * Handles conversion between Project objects and JSON strings.
 * Format-agnostic: doesn't know about ZIP, PNG, or any storage format.
 */

import { err, ok, type Result } from "@/lib/error";
import { type Project, VERSIONS } from "@/types";
import { type EmbeddedProjectData, embeddedProjectDataSchema } from "../types";

/**
 * Serialize a Project to JSON string.
 * Excludes imageUrl as it's stored separately in the archive.
 */
export function serializeProject(project: Project): string {
	const data: EmbeddedProjectData = {
		storageVersion: VERSIONS.storage,
		project: {
			id: project.id,
			name: project.name,
			description: project.description,
			sourceFileName: project.sourceFileName,
			imageWidth: project.imageWidth,
			imageHeight: project.imageHeight,
			elements: project.elements,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
		},
	};

	return JSON.stringify(data);
}

/**
 * Deserialize a Project from JSON string.
 * Requires imageUrl to be provided separately (from archive).
 */
export function deserializeProject(
	json: string,
	imageUrl: string,
): Result<Project, string> {
	try {
		const parsed = JSON.parse(json);
		const result = embeddedProjectDataSchema.safeParse(parsed);

		if (!result.success) {
			const issues = result.error.issues
				.map((i) => `${i.path.join(".")}: ${i.message}`)
				.join(", ");
			return err(`Invalid project data: ${issues}`);
		}

		const data = result.data;

		const project: Project = {
			id: data.project.id,
			name: data.project.name,
			description: data.project.description,
			sourceFileName: data.project.sourceFileName,
			imageUrl,
			imageWidth: data.project.imageWidth,
			imageHeight: data.project.imageHeight,
			elements: data.project.elements,
			createdAt: data.project.createdAt,
			updatedAt: data.project.updatedAt,
		};

		return ok(project);
	} catch (error) {
		return err(
			`Failed to parse project data: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
