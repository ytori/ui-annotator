import { Layers, Maximize, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoomControls } from "../../hooks/use-zoom-controls";
import { selectElements, selectProject, useAnnotationStore } from "../../store";

export interface BottomToolbarProps {
	onLayersClick: () => void;
	onPropertiesClick: () => void;
}

export function BottomToolbar({
	onLayersClick,
	onPropertiesClick,
}: BottomToolbarProps) {
	const project = useAnnotationStore(selectProject);
	const elements = useAnnotationStore(selectElements);
	const { zoomPercentage, zoomIn, zoomOut, zoomToFit } = useZoomControls();

	if (!project) return null;

	return (
		<div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="flex items-center justify-between px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{/* Left: Zoom controls */}
				<div className="flex items-center gap-0.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10"
						onClick={zoomOut}
					>
						<ZoomOut className="h-5 w-5" />
					</Button>
					<span className="w-11 text-center text-xs text-muted-foreground">
						{zoomPercentage}%
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10"
						onClick={zoomIn}
					>
						<ZoomIn className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10"
						onClick={zoomToFit}
					>
						<Maximize className="h-5 w-5" />
					</Button>
				</div>

				{/* Right: Panel triggers */}
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10"
						onClick={onPropertiesClick}
					>
						<Settings className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="relative h-10 w-10"
						onClick={onLayersClick}
					>
						<Layers className="h-5 w-5" />
						{elements.length > 0 && (
							<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
								{elements.length}
							</span>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
