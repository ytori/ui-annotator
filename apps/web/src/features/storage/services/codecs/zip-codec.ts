/**
 * ZIP Archive Codec
 *
 * Implements StorageCodec for ZIP format.
 * Preserves original image format to avoid file size inflation.
 *
 * Archive structure:
 * - {sourceFileName} - Original image file with its original name
 * - project.json - Project metadata (references image by sourceFileName)
 */

import { unzip, zip } from "fflate";
import { err, ok, type Result } from "@/lib/error";
import type { EncodeResult, SerializedProject, StorageCodec } from "./types";

/**
 * File names within the archive
 */
const PROJECT_JSON_FILENAME = "project.json";

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(ext: string): string {
	const extToMime: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
		bmp: "image/bmp",
		svg: "image/svg+xml",
		heic: "image/heic",
		heif: "image/heif",
		avif: "image/avif",
	};
	return extToMime[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Convert Data URL to Uint8Array
 * @throws Error if Data URL format is invalid
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
	const commaIndex = dataUrl.indexOf(",");
	if (commaIndex === -1) {
		throw new Error("Invalid Data URL: missing comma separator");
	}
	const base64 = dataUrl.slice(commaIndex + 1);
	if (!base64) {
		throw new Error("Invalid Data URL: empty data");
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Convert Uint8Array to Data URL
 * Uses chunked processing to avoid call stack limits and improve performance.
 */
function uint8ArrayToDataUrl(data: Uint8Array, mimeType: string): string {
	// Process in chunks to avoid call stack size exceeded for large files
	// 8KB keeps spread operator arguments well within safe limits
	const chunkSize = 0x2000; // 8KB chunks
	const chunks: string[] = [];
	for (let i = 0; i < data.length; i += chunkSize) {
		const chunk = data.subarray(i, i + chunkSize);
		chunks.push(String.fromCharCode(...chunk));
	}
	const base64 = btoa(chunks.join(""));
	return `data:${mimeType};base64,${base64}`;
}

/**
 * ZIP Storage Codec
 *
 * Stores projects as ZIP archives containing:
 * - {sourceFileName}: Original image with its original filename
 * - project.json: Project metadata (references image by sourceFileName)
 */
export const zipCodec: StorageCodec = {
	id: "zip",
	name: "ZIP Archive",
	extension: "zip",
	mimeType: "application/zip",

	canDecode(buffer: ArrayBuffer): boolean {
		if (buffer.byteLength < 4) return false;
		const data = new Uint8Array(buffer);
		// ZIP files start with PK signature (0x50 0x4B)
		return data[0] === 0x50 && data[1] === 0x4b;
	},

	async encode(data: SerializedProject): Promise<Result<EncodeResult, string>> {
		try {
			// Extract sourceFileName from project JSON
			const projectData = JSON.parse(data.projectJson) as {
				project: { sourceFileName: string };
			};
			const imageFilename = projectData.project.sourceFileName;

			const imageData = dataUrlToUint8Array(data.imageDataUrl);
			const jsonData = new TextEncoder().encode(data.projectJson);

			const zipData = await new Promise<Uint8Array>((resolve, reject) => {
				zip(
					{
						[imageFilename]: imageData,
						[PROJECT_JSON_FILENAME]: jsonData,
					},
					{ level: 0 }, // No compression for images (already compressed)
					(zipErr, result) => {
						if (zipErr) {
							reject(new Error(`Failed to create ZIP: ${zipErr.message}`));
						} else {
							resolve(result);
						}
					},
				);
			});

			return ok({
				data: zipData,
				mimeType: this.mimeType,
				extension: this.extension,
			});
		} catch (error) {
			return err(
				`Failed to encode ZIP: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},

	async decode(
		buffer: ArrayBuffer,
	): Promise<Result<SerializedProject, string>> {
		try {
			const result = await new Promise<SerializedProject>((resolve, reject) => {
				unzip(new Uint8Array(buffer), (unzipErr, files) => {
					if (unzipErr) {
						reject(new Error(`Failed to extract ZIP: ${unzipErr.message}`));
						return;
					}

					// Find project.json first
					const projectJsonData = files[PROJECT_JSON_FILENAME];
					if (!projectJsonData) {
						reject(new Error("No project.json found in archive"));
						return;
					}

					// Extract project JSON and get sourceFileName
					const projectJson = new TextDecoder().decode(projectJsonData);
					let sourceFileName: string;
					try {
						const projectData = JSON.parse(projectJson) as {
							project: { sourceFileName: string };
						};
						sourceFileName = projectData.project.sourceFileName;
					} catch {
						reject(new Error("Invalid project.json format"));
						return;
					}

					// Find image file by sourceFileName
					const imageData = files[sourceFileName];
					if (!imageData) {
						reject(
							new Error(`Image file not found in archive: ${sourceFileName}`),
						);
						return;
					}

					// Extract image
					const ext = sourceFileName.split(".").pop() || "bin";
					const mimeType = getMimeTypeFromExtension(ext);
					const imageDataUrl = uint8ArrayToDataUrl(imageData, mimeType);

					resolve({
						imageDataUrl,
						projectJson,
					});
				});
			});

			return ok(result);
		} catch (error) {
			return err(
				`Failed to decode ZIP: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
};
