import { useAnnotationStore } from "../store";

/**
 * Hook for zoom control state and actions
 * Centralizes zoom-related store selectors to avoid duplication
 */
export function useZoomControls() {
  const viewport = useAnnotationStore((state) => state.viewport);
  const zoomIn = useAnnotationStore((state) => state.zoomIn);
  const zoomOut = useAnnotationStore((state) => state.zoomOut);
  const zoomToFit = useAnnotationStore((state) => state.zoomToFit);

  return {
    zoomPercentage: Math.round(viewport.scale * 100),
    zoomIn,
    zoomOut,
    zoomToFit,
  };
}
