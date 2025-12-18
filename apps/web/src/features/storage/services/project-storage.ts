/**
 * Project Storage Service
 *
 * Handles Open/Save operations with PNG embedding.
 */

import { v4 as uuidv4 } from "uuid";
import { err, ok, type Result } from "@/lib/error";
import { loadImageWithDimensions } from "@/lib/image";
import { type Project, VERSIONS } from "@/types";
import {
	type EmbeddedProjectData,
	embeddedProjectDataSchema,
	type OpenResult,
} from "../types";
import {
	DEFAULT_CHUNK_KEY,
	isValidPng,
	readPngTextChunk,
	writePngTextChunk,
} from "./png-codec";

/**
 * Maximum image Data URL size in bytes.
 * localStorage has ~5MB limit, Base64 adds ~33% overhead.
 * Reserve space for project metadata and elements.
 */
const MAX_IMAGE_DATA_URL_SIZE = 3 * 1024 * 1024; // 3MB

/**
 * Read a File as ArrayBuffer.
 */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsArrayBuffer(file);
	});
}

/**
 * Read a File as Data URL.
 */
async function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}

/**
 * Convert Data URL to ArrayBuffer.
 */
async function dataURLToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
	const response = await fetch(dataUrl);
	return response.arrayBuffer();
}

/**
 * Convert any image to PNG data URL using canvas.
 */
async function convertToPngDataUrl(imageUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Failed to get canvas context"));
				return;
			}
			ctx.drawImage(img, 0, 0);
			resolve(canvas.toDataURL("image/png"));
		};
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = imageUrl;
	});
}

/**
 * Serialize project to JSON string for embedding.
 * Excludes imageUrl as the PNG itself is the image source.
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
 * Deserialize project from embedded JSON string.
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

/**
 * Open an image file and extract project data if present (PNG only).
 * Supports all image formats. For non-PNG or PNG without embedded data,
 * creates a new project from the image.
 *
 * Returns both the project data and the loaded image element,
 * ensuring they are ready for immediate use together.
 *
 * @param file - Image file to open
 * @returns Result containing the project, loaded image, and whether it had embedded data
 */
export async function openImageFile(
	file: File,
): Promise<Result<OpenResult, string>> {
	try {
		// Read file as DataURL for display
		const dataUrl = await readFileAsDataURL(file);

		// Check Data URL size
		if (dataUrl.length > MAX_IMAGE_DATA_URL_SIZE) {
			const sizeMB = (dataUrl.length / (1024 * 1024)).toFixed(1);
			const maxMB = (MAX_IMAGE_DATA_URL_SIZE / (1024 * 1024)).toFixed(0);
			return err(`Image too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`);
		}

		// Load image element (required for both new and restored projects)
		const { image, width, height } = await loadImageWithDimensions(dataUrl);

		// Check if it's a PNG file - only PNG can have embedded data
		const isPng = file.type === "image/png";

		if (isPng) {
			// Read as ArrayBuffer for PNG parsing
			const buffer = await readFileAsArrayBuffer(file);

			// Validate PNG
			if (isValidPng(buffer)) {
				// Try to extract embedded project data
				const embeddedJson = readPngTextChunk(buffer, DEFAULT_CHUNK_KEY);

				if (embeddedJson) {
					// Embedded data found - restore project
					const result = deserializeProject(embeddedJson, dataUrl);
					if (!result.success) {
						return err(result.error);
					}

					return ok({
						project: result.data,
						image,
						hasEmbeddedData: true,
					});
				}
			}
		}

		// No embedded data or non-PNG - create new project from image
		const now = new Date().toISOString();

		// Remove extension and .uianno suffix if present
		const baseName = file.name
			.replace(/\.[^/.]+$/, "") // Remove extension
			.replace(/\.uianno$/, ""); // Remove .uianno suffix

		const project: Project = {
			id: uuidv4(),
			name: baseName,
			sourceFileName: file.name,
			imageUrl: dataUrl,
			imageWidth: width,
			imageHeight: height,
			elements: [],
			createdAt: now,
			updatedAt: now,
		};

		return ok({
			project,
			image,
			hasEmbeddedData: false,
		});
	} catch (error) {
		return err(
			`Failed to open file: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Result of save operation including the blob and suggested filename.
 */
export interface SaveResult {
	blob: Blob;
	filename: string;
}

/**
 * Save project by embedding data into PNG.
 * Converts non-PNG images to PNG format.
 * Uses .uianno.png extension for saved files.
 *
 * @param project - Project to save
 * @returns Result containing a Blob of the PNG with embedded data and filename
 */
export async function saveProjectFile(
	project: Project,
): Promise<Result<SaveResult, string>> {
	try {
		// Convert image to PNG if needed
		let pngDataUrl = project.imageUrl;
		if (!project.imageUrl.startsWith("data:image/png")) {
			pngDataUrl = await convertToPngDataUrl(project.imageUrl);
		}

		// Convert PNG data URL to ArrayBuffer
		const buffer = await dataURLToArrayBuffer(pngDataUrl);

		// Validate it's a valid PNG
		if (!isValidPng(buffer)) {
			return err("Failed to convert image to PNG");
		}

		// Serialize project data
		const json = serializeProject(project);

		// Embed data into PNG
		const newBuffer = writePngTextChunk(buffer, DEFAULT_CHUNK_KEY, json);

		// Create Blob
		const blob = new Blob([newBuffer], { type: "image/png" });

		// Generate filename: name.uianno.png
		const baseName = project.name.replace(/\.uianno$/, ""); // Remove .uianno if present
		const filename = `${baseName}.uianno.png`;

		return ok({ blob, filename });
	} catch (error) {
		return err(
			`Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
