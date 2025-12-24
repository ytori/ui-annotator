import { Hand, Maximize, Pencil, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoomControls } from "../../hooks/use-zoom-controls";
import { selectProject, useAnnotationStore } from "../../store";

export function FloatingToolbar() {
  const project = useAnnotationStore(selectProject);
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);

  if (!project) {
    return null;
  }

  return (
    <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
      <div className="relative flex items-center gap-2 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Tool switcher */}
        <div className="relative flex">
          {/* Sliding background */}
          <div
            className={`absolute top-0 left-0 h-8 w-8 rounded-md bg-blue-600 transition-transform duration-200 ease-out ${
              activeTool === "pan" ? "translate-x-9" : "translate-x-0"
            }`}
          />
          <button
            className={`relative z-10 flex h-8 w-8 items-center justify-center transition-colors duration-200 ${
              activeTool === "edit"
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTool("edit")}
            title="Annotate (V)"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className={`relative z-10 ml-1 flex h-8 w-8 items-center justify-center transition-colors duration-200 ${
              activeTool === "pan"
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTool("pan")}
            title="Pan (H)"
            type="button"
          >
            <Hand className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ZoomControls() {
  const project = useAnnotationStore(selectProject);
  const { zoomPercentage, zoomIn, zoomOut, zoomToFit } = useZoomControls();

  if (!project) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="flex items-center gap-1 rounded-lg border bg-background/95 p-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button
          className="h-7 w-7"
          onClick={zoomOut}
          size="icon"
          title="Zoom Out"
          variant="ghost"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-muted-foreground text-xs">
          {zoomPercentage}%
        </span>
        <Button
          className="h-7 w-7"
          onClick={zoomIn}
          size="icon"
          title="Zoom In"
          variant="ghost"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          className="h-7 w-7"
          onClick={zoomToFit}
          size="icon"
          title="Fit to View"
          variant="ghost"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Mobile-optimized floating tool switcher
 * Positioned above the bottom toolbar
 */
export function MobileToolSwitcher() {
  const project = useAnnotationStore(selectProject);
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);

  if (!project) {
    return null;
  }

  return (
    <div className="absolute bottom-20 left-4 z-10">
      <div className="relative flex flex-col rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Sliding background */}
        <div
          className={`absolute right-1 left-1 h-10 rounded-md bg-blue-600 transition-transform duration-200 ease-out ${
            activeTool === "pan" ? "translate-y-11" : "translate-y-0"
          }`}
          style={{ top: "4px" }}
        />
        <button
          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 ${
            activeTool === "edit" ? "text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTool("edit")}
          type="button"
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          className={`relative z-10 mt-1 flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 ${
            activeTool === "pan" ? "text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTool("pan")}
          type="button"
        >
          <Hand className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
