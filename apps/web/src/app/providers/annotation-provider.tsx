import type { ReactNode } from "react";
import { IconResolverProvider } from "@/features/annotation";
import { getComponentIcon } from "@/features/component-catalog";

/**
 * Annotation Provider
 *
 * Provides context for the annotation feature:
 * - Icon resolver from component-catalog
 *
 * This provider bridges the annotation feature with component-catalog
 * without creating a direct dependency.
 */
export function AnnotationProvider({ children }: { children: ReactNode }) {
  return (
    <IconResolverProvider resolver={getComponentIcon}>
      {children}
    </IconResolverProvider>
  );
}
