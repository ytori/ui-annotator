import { Hand, Maximize, Pencil, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoomControls } from "../../hooks/use-zoom-controls";
import { selectProject, useAnnotationStore } from "../../store";

export function FloatingToolbar() {
	const project = useAnnotationStore(selectProject);
	const activeTool = useAnnotationStore((state) => state.activeTool);
	const setActiveTool = useAnnotationStore((state) => state.setActiveTool);

	if (!project) return null;

	return (
		<div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
			<div className="relative flex items-center gap-2 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
				{/* Tool switcher */}
				<div className="relative flex">
					{/* Sliding background */}
					<div
						className={`absolute left-0 top-0 h-8 w-8 rounded-md bg-blue-600 transition-transform duration-200 ease-out ${
							activeTool === "pan" ? "translate-x-9" : "translate-x-0"
						}`}
					/>
					<button
						type="button"
						className={`relative z-10 flex h-8 w-8 items-center justify-center transition-colors duration-200 ${
							activeTool === "edit"
								? "text-white"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => setActiveTool("edit")}
						title="Annotate (V)"
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						className={`relative z-10 ml-1 flex h-8 w-8 items-center justify-center transition-colors duration-200 ${
							activeTool === "pan"
								? "text-white"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => setActiveTool("pan")}
						title="Pan (H)"
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

	if (!project) return null;

	return (
		<div className="absolute bottom-4 left-4 z-10">
			<div className="flex items-center gap-1 rounded-lg border bg-background/95 p-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={zoomOut}
					title="Zoom Out"
				>
					<ZoomOut className="h-4 w-4" />
				</Button>
				<span className="w-12 text-center text-xs text-muted-foreground">
					{zoomPercentage}%
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={zoomIn}
					title="Zoom In"
				>
					<ZoomIn className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={zoomToFit}
					title="Fit to View"
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

	if (!project) return null;

	return (
		<div className="absolute bottom-20 left-4 z-10">
			<div className="relative flex flex-col rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
				{/* Sliding background */}
				<div
					className={`absolute left-1 right-1 h-10 rounded-md bg-blue-600 transition-transform duration-200 ease-out ${
						activeTool === "pan" ? "translate-y-11" : "translate-y-0"
					}`}
					style={{ top: "4px" }}
				/>
				<button
					type="button"
					className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 ${
						activeTool === "edit" ? "text-white" : "text-muted-foreground"
					}`}
					onClick={() => setActiveTool("edit")}
				>
					<Pencil className="h-5 w-5" />
				</button>
				<button
					type="button"
					className={`relative z-10 mt-1 flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200 ${
						activeTool === "pan" ? "text-white" : "text-muted-foreground"
					}`}
					onClick={() => setActiveTool("pan")}
				>
					<Hand className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
}
