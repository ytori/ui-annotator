/**
 * Image Loading Utilities
 *
 * Provides functions for loading images from various sources.
 */

/**
 * Load an image from a URL (including data URLs).
 * Returns a promise that resolves to the loaded HTMLImageElement.
 *
 * @param url - The URL or data URL of the image
 * @returns Promise resolving to the loaded image element
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Load an image from a URL and return dimensions along with the element.
 *
 * @param url - The URL or data URL of the image
 * @returns Promise resolving to image element and dimensions
 */
export async function loadImageWithDimensions(
  url: string
): Promise<{ image: HTMLImageElement; width: number; height: number }> {
  const image = await loadImageFromUrl(url);
  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}
