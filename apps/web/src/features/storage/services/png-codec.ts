/**
 * PNG tEXt Chunk Codec
 *
 * Handles reading/writing tEXt chunks in PNG files.
 * Uses Web APIs only (no external libraries).
 *
 * PNG Chunk Structure:
 * - Length (4 bytes, big-endian)
 * - Type (4 bytes, ASCII)
 * - Data (Length bytes)
 * - CRC (4 bytes, big-endian)
 */

// PNG signature (8 bytes)
const PNG_SIGNATURE = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Chunk type constants
const CHUNK_TYPE_IEND = "IEND";
const CHUNK_TYPE_TEXT = "tEXt";

// Default chunk key for our data
export const DEFAULT_CHUNK_KEY = "ui-annotator";

// CRC32 lookup table (initialized lazily)
let crcTable: Uint32Array | null = null;

/**
 * Initialize CRC32 lookup table with PNG polynomial (0xEDB88320).
 */
function initCrcTable(): Uint32Array {
	if (crcTable) return crcTable;

	crcTable = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let j = 0; j < 8; j++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		crcTable[i] = c;
	}
	return crcTable;
}

/**
 * Calculate CRC32 for given data.
 */
function crc32(data: Uint8Array): number {
	const table = initCrcTable();
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Validate PNG signature.
 */
function isPngSignature(data: Uint8Array): boolean {
	if (data.length < 8) return false;
	for (let i = 0; i < 8; i++) {
		if (data[i] !== PNG_SIGNATURE[i]) return false;
	}
	return true;
}

/**
 * Read a 4-byte big-endian unsigned integer.
 */
function readUint32(data: Uint8Array, offset: number): number {
	return (
		((data[offset] << 24) |
			(data[offset + 1] << 16) |
			(data[offset + 2] << 8) |
			data[offset + 3]) >>>
		0
	);
}

/**
 * Write a 4-byte big-endian unsigned integer.
 */
function writeUint32(data: Uint8Array, offset: number, value: number): void {
	data[offset] = (value >>> 24) & 0xff;
	data[offset + 1] = (value >>> 16) & 0xff;
	data[offset + 2] = (value >>> 8) & 0xff;
	data[offset + 3] = value & 0xff;
}

/**
 * Read chunk type as ASCII string.
 */
function readChunkType(data: Uint8Array, offset: number): string {
	return String.fromCharCode(
		data[offset],
		data[offset + 1],
		data[offset + 2],
		data[offset + 3],
	);
}

/**
 * Encode UTF-8 string to Base64.
 */
function utf8ToBase64(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Decode Base64 to UTF-8 string.
 */
function base64ToUtf8(base64: string): string {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

/**
 * Parse a tEXt chunk data into key-value pair.
 * tEXt format: keyword + null separator (0x00) + text
 * Value is Base64 encoded to support UTF-8 (including Japanese).
 */
function parseTextChunk(data: Uint8Array): { key: string; value: string } {
	const nullIndex = data.indexOf(0);
	if (nullIndex === -1) {
		return { key: "", value: "" };
	}

	const key = new TextDecoder("latin1").decode(data.slice(0, nullIndex));
	const base64Value = new TextDecoder("latin1").decode(
		data.slice(nullIndex + 1),
	);

	try {
		// Decode Base64 to UTF-8
		const value = base64ToUtf8(base64Value);
		return { key, value };
	} catch {
		// Fallback: return as-is if not valid Base64
		return { key, value: base64Value };
	}
}

/**
 * Read tEXt chunk data from PNG ArrayBuffer.
 *
 * @param buffer - PNG file as ArrayBuffer
 * @param key - The keyword to search for (default: "ui-annotator")
 * @returns The text value if found, null otherwise
 */
export function readPngTextChunk(
	buffer: ArrayBuffer,
	key: string = DEFAULT_CHUNK_KEY,
): string | null {
	const data = new Uint8Array(buffer);

	// Validate PNG signature
	if (!isPngSignature(data)) {
		return null;
	}

	// Parse chunks starting after signature
	let offset = 8;

	while (offset < data.length) {
		// Minimum chunk size: length(4) + type(4) + crc(4) = 12 bytes
		if (offset + 12 > data.length) {
			break;
		}

		// Read chunk header
		const length = readUint32(data, offset);

		// Bounds check: ensure chunk data + CRC fits within buffer
		const chunkEnd = offset + 12 + length;
		if (chunkEnd > data.length || length > data.length) {
			// Malformed chunk - stop parsing
			break;
		}

		const type = readChunkType(data, offset + 4);

		// Check if this is a tEXt chunk
		if (type === CHUNK_TYPE_TEXT) {
			const chunkData = data.slice(offset + 8, offset + 8 + length);
			const parsed = parseTextChunk(chunkData);

			if (parsed.key === key) {
				return parsed.value;
			}
		}

		// Stop at IEND
		if (type === CHUNK_TYPE_IEND) {
			break;
		}

		// Move to next chunk (length + type(4) + data + crc(4))
		offset += 12 + length;
	}

	return null;
}

/**
 * Create a tEXt chunk with the given key-value pair.
 * Value is Base64 encoded to support UTF-8 (including Japanese).
 */
function createTextChunk(key: string, value: string): Uint8Array {
	// Key must be Latin-1 compatible (ASCII)
	const keyBytes = new TextEncoder().encode(key);
	// Encode value as Base64 to support UTF-8
	const base64Value = utf8ToBase64(value);
	const valueBytes = new TextEncoder().encode(base64Value);

	// Data = key + null + value
	const dataLength = keyBytes.length + 1 + valueBytes.length;
	const chunkData = new Uint8Array(dataLength);
	chunkData.set(keyBytes, 0);
	chunkData[keyBytes.length] = 0; // null separator
	chunkData.set(valueBytes, keyBytes.length + 1);

	// Create full chunk: length(4) + type(4) + data + crc(4)
	const chunkLength = 4 + 4 + dataLength + 4;
	const chunk = new Uint8Array(chunkLength);

	// Write length
	writeUint32(chunk, 0, dataLength);

	// Write type "tEXt"
	chunk[4] = 0x74; // t
	chunk[5] = 0x45; // E
	chunk[6] = 0x58; // X
	chunk[7] = 0x74; // t

	// Write data
	chunk.set(chunkData, 8);

	// Calculate CRC (over type + data)
	const crcData = chunk.slice(4, 8 + dataLength);
	const crcValue = crc32(crcData);
	writeUint32(chunk, 8 + dataLength, crcValue);

	return chunk;
}

/**
 * Write tEXt chunk to PNG ArrayBuffer.
 * Inserts the chunk before the IEND chunk.
 * If a chunk with the same key exists, it will be replaced.
 *
 * @param buffer - PNG file as ArrayBuffer
 * @param key - The keyword for the chunk
 * @param value - The text value to store
 * @returns New ArrayBuffer with the tEXt chunk added
 */
export function writePngTextChunk(
	buffer: ArrayBuffer,
	key: string,
	value: string,
): ArrayBuffer {
	const data = new Uint8Array(buffer);

	// Validate PNG signature
	if (!isPngSignature(data)) {
		throw new Error("Invalid PNG signature");
	}

	// Find IEND position and collect chunks (excluding existing matching tEXt)
	const chunks: Uint8Array[] = [];
	let offset = 8;
	let iendOffset = -1;

	while (offset < data.length) {
		// Minimum chunk size: length(4) + type(4) + crc(4) = 12 bytes
		if (offset + 12 > data.length) {
			break;
		}

		const length = readUint32(data, offset);

		// Bounds check: ensure chunk data + CRC fits within buffer
		const chunkSize = 12 + length;
		if (offset + chunkSize > data.length || length > data.length) {
			// Malformed chunk - stop parsing
			break;
		}

		const type = readChunkType(data, offset + 4);

		if (type === CHUNK_TYPE_IEND) {
			iendOffset = offset;
			break;
		}

		// Skip existing chunk with same key
		if (type === CHUNK_TYPE_TEXT) {
			const chunkData = data.slice(offset + 8, offset + 8 + length);
			const parsed = parseTextChunk(chunkData);
			if (parsed.key === key) {
				offset += chunkSize;
				continue;
			}
		}

		// Keep this chunk
		chunks.push(data.slice(offset, offset + chunkSize));
		offset += chunkSize;
	}

	if (iendOffset === -1) {
		throw new Error("Invalid PNG: IEND chunk not found");
	}

	// Create new tEXt chunk
	const textChunk = createTextChunk(key, value);

	// Get IEND chunk
	const iendLength = readUint32(data, iendOffset);
	const iendChunk = data.slice(iendOffset, iendOffset + 4 + 4 + iendLength + 4);

	// Calculate total size
	let totalSize = 8; // PNG signature
	for (const chunk of chunks) {
		totalSize += chunk.length;
	}
	totalSize += textChunk.length;
	totalSize += iendChunk.length;

	// Build new PNG
	const result = new Uint8Array(totalSize);
	let writeOffset = 0;

	// Write PNG signature
	result.set(PNG_SIGNATURE, writeOffset);
	writeOffset += 8;

	// Write existing chunks
	for (const chunk of chunks) {
		result.set(chunk, writeOffset);
		writeOffset += chunk.length;
	}

	// Write new tEXt chunk
	result.set(textChunk, writeOffset);
	writeOffset += textChunk.length;

	// Write IEND
	result.set(iendChunk, writeOffset);

	return result.buffer;
}

/**
 * Check if a buffer is a valid PNG file.
 */
export function isValidPng(buffer: ArrayBuffer): boolean {
	return isPngSignature(new Uint8Array(buffer));
}
