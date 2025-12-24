/**
 * Hook for file input configuration.
 * Provides accept pattern and file validation from storage layer.
 */

import { getAcceptPattern, isAcceptableFile } from "@/features/storage";

export function useFileInputConfig() {
  return {
    acceptPattern: getAcceptPattern(),
    isAcceptableFile,
  };
}
