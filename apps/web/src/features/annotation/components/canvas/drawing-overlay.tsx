import { Line, Rect } from "react-konva";
import type { Point } from "@/types";
import { colorToRgb, colorToRgba, primaryColors } from "../../constants/colors";
import type { CanvasMode } from "../../lib/canvas-utils";
import type { SnapGuideline } from "../../store";

interface DrawingOverlayProps {
	mode: CanvasMode;
	drawCurrent: Point | null;
	guidelines: SnapGuideline[];
	imageWidth: number;
	imageHeight: number;
}

/**
 * Renders drawing preview rectangle and snap guidelines.
 * Shows visual feedback during annotation creation.
 */
export function DrawingOverlay({
	mode,
	drawCurrent,
	guidelines,
	imageWidth,
	imageHeight,
}: DrawingOverlayProps) {
	// Drawing preview rectangle
	let previewRect = null;
	if (mode.type === "drawing" && drawCurrent) {
		const { start } = mode;
		const x = Math.min(start.x, drawCurrent.x);
		const y = Math.min(start.y, drawCurrent.y);
		const w = Math.abs(drawCurrent.x - start.x);
		const h = Math.abs(drawCurrent.y - start.y);

		previewRect = (
			<Rect
				x={x}
				y={y}
				width={w}
				height={h}
				fill={colorToRgba(primaryColors.primary, 0.2)}
				stroke={colorToRgb(primaryColors.primary)}
				strokeWidth={2}
				strokeScaleEnabled={false}
				dash={[6, 3]}
			/>
		);
	}

	return (
		<>
			{previewRect}

			{/* Snap guidelines */}
			{guidelines.map((line, idx) =>
				line.type === "vertical" ? (
					<Line
						key={`guide-v-${line.position}-${idx}`}
						points={[line.position, 0, line.position, imageHeight]}
						stroke={colorToRgb(primaryColors.guideline)}
						strokeWidth={1}
						strokeScaleEnabled={false}
						dash={[4, 2]}
					/>
				) : (
					<Line
						key={`guide-h-${line.position}-${idx}`}
						points={[0, line.position, imageWidth, line.position]}
						stroke={colorToRgb(primaryColors.guideline)}
						strokeWidth={1}
						strokeScaleEnabled={false}
						dash={[4, 2]}
					/>
				),
			)}
		</>
	);
}
