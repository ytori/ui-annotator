/**
 * Project Storage Service
 *
 * High-level API for opening and saving projects.
 * Delegates to codecs for format-specific encoding/decoding.
 */

import { v4 as uuidv4 } from "uuid";
import { err, ok, type Result } from "@/lib/error";
import { loadImageWithDimensions } from "@/lib/image";
import type { Project } from "@/types";
import type { OpenResult } from "../types";
import { defaultCodec, findCodecForBuffer } from "./codecs";
import { deserializeProject, serializeProject } from "./project-serializer";

/**
 * Project file suffix (without extension).
 * Used for generating and parsing filenames.
 */
const PROJECT_SUFFIX = "uiannotator";

/**
 * Maximum image file size in bytes.
 * localStorage has ~5MB limit, Base64 adds ~33% overhead.
 * 3MB image → ~4MB Data URL, leaving ~1MB for metadata/elements.
 */
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

/** Regex to remove file extension */
const FILE_EXTENSION_REGEX = /\.[^/.]+$/;

/**
 * Read a File as ArrayBuffer.
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
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
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Check image size and return error if too large.
 * Estimates original file size from Data URL length (Base64 adds ~33% overhead).
 */
function checkImageSize(dataUrl: string): Result<void, string> {
  // Estimate original size: Data URL base64 part is ~133% of original
  const base64Part = dataUrl.split(",")[1] || "";
  const estimatedSize = (base64Part.length * 3) / 4; // Base64 decode ratio

  if (estimatedSize > MAX_IMAGE_SIZE) {
    const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
    return err(`Image too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`);
  }
  return ok(undefined);
}

/**
 * Open a project file using the appropriate codec.
 */
async function openProjectFile(
  buffer: ArrayBuffer
): Promise<Result<OpenResult, string>> {
  const codec = findCodecForBuffer(buffer);
  if (!codec) {
    return err("Unknown file format");
  }

  const decodeResult = await codec.decode(buffer);
  if (!decodeResult.success) {
    return err(decodeResult.error);
  }

  const { imageDataUrl, projectJson } = decodeResult.data;

  // Check image size
  const sizeCheck = checkImageSize(imageDataUrl);
  if (!sizeCheck.success) {
    return err(sizeCheck.error);
  }

  // Load image element
  const { image } = await loadImageWithDimensions(imageDataUrl);

  // Deserialize project
  const projectResult = deserializeProject(projectJson, imageDataUrl);
  if (!projectResult.success) {
    return err(projectResult.error);
  }

  return ok({
    project: projectResult.data,
    image,
    hasEmbeddedData: true,
  });
}

/**
 * Create a new project from an image file.
 */
async function createNewProject(
  file: File,
  dataUrl: string
): Promise<Result<OpenResult, string>> {
  // Load image element
  const { image, width, height } = await loadImageWithDimensions(dataUrl);

  const now = new Date().toISOString();

  // Remove extension and project suffix if present
  const suffixPattern = new RegExp(`\\.${PROJECT_SUFFIX}$`);
  const baseName = file.name
    .replace(FILE_EXTENSION_REGEX, "") // Remove extension
    .replace(suffixPattern, ""); // Remove project suffix

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
}

/**
 * Open an image or project file.
 *
 * - If the file is a known project format (ZIP, etc.), opens it as a project
 * - Otherwise, creates a new project from the image
 *
 * @param file - Image or project file to open
 * @returns Result containing the project, loaded image, and whether it had embedded data
 */
export async function openFile(
  file: File
): Promise<Result<OpenResult, string>> {
  try {
    // Read as ArrayBuffer for format detection
    const buffer = await readFileAsArrayBuffer(file);

    // Try to find a codec that can handle this format
    const codec = findCodecForBuffer(buffer);
    if (codec) {
      // Project file - image size checked after extraction
      return openProjectFile(buffer);
    }

    // Plain image - check file size directly (fail fast)
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const maxMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
      return err(`Image too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`);
    }

    const dataUrl = await readFileAsDataURL(file);
    return createNewProject(file, dataUrl);
  } catch (error) {
    return err(
      `Failed to open file: ${error instanceof Error ? error.message : "Unknown error"}`
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
 * Save project using the default codec.
 *
 * @param project - Project to save
 * @returns Result containing a Blob and suggested filename
 */
export async function saveProjectFile(
  project: Project
): Promise<Result<SaveResult, string>> {
  try {
    // Serialize project to JSON
    const projectJson = serializeProject(project);

    // Encode using default codec
    const encodeResult = await defaultCodec.encode({
      projectJson,
      imageDataUrl: project.imageUrl,
    });

    if (!encodeResult.success) {
      return err(encodeResult.error);
    }

    const { data, mimeType, extension } = encodeResult.data;

    // Create Blob (type assertion needed due to TS strict ArrayBufferLike handling)
    const blob = new Blob([data as BlobPart], { type: mimeType });

    // Generate filename: name.{suffix}.{extension}
    const suffixPattern = new RegExp(`\\.${PROJECT_SUFFIX}$`);
    const baseName = project.name.replace(suffixPattern, "");
    const filename = `${baseName}.${PROJECT_SUFFIX}.${extension}`;

    return ok({ blob, filename });
  } catch (error) {
    return err(
      `Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
