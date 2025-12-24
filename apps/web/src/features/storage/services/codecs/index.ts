/**
 * Storage Codecs
 *
 * Registry of available storage format codecs.
 */

import type { StorageCodec } from "./types";
import { zipCodec } from "./zip-codec";

/**
 * All available codecs
 */
const codecs: StorageCodec[] = [zipCodec];

/**
 * Default codec for saving
 */
export const defaultCodec: StorageCodec = zipCodec;

/**
 * Find a codec that can decode the given buffer
 */
export function findCodecForBuffer(buffer: ArrayBuffer): StorageCodec | null {
	return codecs.find((codec) => codec.canDecode(buffer)) ?? null;
}

/**
 * Get accept pattern for file inputs.
 * Combines image/* with all registered codec extensions.
 */
export function getAcceptPattern(): string {
	const codecExtensions = codecs.map((c) => `.${c.extension}`);
	return ["image/*", ...codecExtensions].join(",");
}

/**
 * Check if a file is acceptable (image or project file).
 */
export function isAcceptableFile(file: File): boolean {
	if (file.type.startsWith("image/")) {
		return true;
	}
	return codecs.some(
		(c) => file.type === c.mimeType || file.name.endsWith(`.${c.extension}`),
	);
}
