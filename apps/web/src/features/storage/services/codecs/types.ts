/**
 * Storage Codec Types
 *
 * Common interfaces for storage format codecs.
 * Each codec handles a specific file format (ZIP, JSON+sidecar, etc.)
 */

import type { Result } from "@/lib/error";

/**
 * Serialized project data (format-agnostic)
 */
export interface SerializedProject {
  /** Project metadata as JSON string */
  projectJson: string;
  /** Image as Data URL (preserves original format) */
  imageDataUrl: string;
}

/**
 * Result of encoding a project
 */
export interface EncodeResult {
  /** Encoded data as Uint8Array */
  data: Uint8Array;
  /** MIME type of the encoded data */
  mimeType: string;
  /** Suggested file extension (without dot) */
  extension: string;
}

/**
 * Storage codec interface
 *
 * Codecs are responsible for encoding/decoding projects to/from
 * specific file formats. They don't know about Project structure,
 * only about SerializedProject (JSON + image).
 */
export interface StorageCodec {
  /** Unique identifier for this codec */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** File extension (without dot) */
  readonly extension: string;

  /** MIME type */
  readonly mimeType: string;

  /**
   * Check if a buffer is in this codec's format
   */
  canDecode(buffer: ArrayBuffer): boolean;

  /**
   * Encode serialized project data to this format
   */
  encode(data: SerializedProject): Promise<Result<EncodeResult, string>>;

  /**
   * Decode data from this format to serialized project
   */
  decode(buffer: ArrayBuffer): Promise<Result<SerializedProject, string>>;
}
