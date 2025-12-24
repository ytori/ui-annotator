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
  let previewRect: React.ReactNode = null;
  if (mode.type === "drawing" && drawCurrent) {
    const { start } = mode;
    const x = Math.min(start.x, drawCurrent.x);
    const y = Math.min(start.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - start.x);
    const h = Math.abs(drawCurrent.y - start.y);

    previewRect = (
      <Rect
        dash={[6, 3]}
        fill={colorToRgba(primaryColors.primary, 0.2)}
        height={h}
        stroke={colorToRgb(primaryColors.primary)}
        strokeScaleEnabled={false}
        strokeWidth={2}
        width={w}
        x={x}
        y={y}
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
            dash={[4, 2]}
            key={`guide-v-${line.position}-${idx}`}
            points={[line.position, 0, line.position, imageHeight]}
            stroke={colorToRgb(primaryColors.guideline)}
            strokeScaleEnabled={false}
            strokeWidth={1}
          />
        ) : (
          <Line
            dash={[4, 2]}
            key={`guide-h-${line.position}-${idx}`}
            points={[0, line.position, imageWidth, line.position]}
            stroke={colorToRgb(primaryColors.guideline)}
            strokeScaleEnabled={false}
            strokeWidth={1}
          />
        )
      )}
    </>
  );
}
