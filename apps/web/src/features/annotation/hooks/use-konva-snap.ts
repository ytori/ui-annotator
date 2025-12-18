import { useCallback } from "react";
import type { EditorElement, ElementId } from "@/types";
import { snapConfig } from "../constants/canvas";
import { useUIStore } from "../store";

interface SnapTarget {
	value: number;
	type: "edge" | "center" | "bound";
}

interface BoundingBox {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function useKonvaSnap() {
	const setActiveGuidelines = useUIStore((state) => state.setActiveGuidelines);
	const clearActiveGuidelines = useUIStore(
		(state) => state.clearActiveGuidelines,
	);

	const getSnapResult = useCallback(
		(
			point: { x: number; y: number },
			elements: EditorElement[],
			excludeIds: ElementId[],
			imageWidth: number,
			imageHeight: number,
			movingBox?: BoundingBox,
		): { x: number; y: number } => {
			const verticalTargets: SnapTarget[] = [];
			const horizontalTargets: SnapTarget[] = [];

			// Add element edges and centers
			for (const element of elements) {
				if (excludeIds.includes(element.id)) continue;

				const { x, y, w, h } = element.bbox.pixel;

				// Vertical lines (x positions)
				verticalTargets.push(
					{ value: x, type: "edge" },
					{ value: x + w, type: "edge" },
					{ value: x + w / 2, type: "center" },
				);

				// Horizontal lines (y positions)
				horizontalTargets.push(
					{ value: y, type: "edge" },
					{ value: y + h, type: "edge" },
					{ value: y + h / 2, type: "center" },
				);
			}

			// Add image bounds
			verticalTargets.push(
				{ value: 0, type: "bound" },
				{ value: imageWidth / 2, type: "bound" },
				{ value: imageWidth, type: "bound" },
			);
			horizontalTargets.push(
				{ value: 0, type: "bound" },
				{ value: imageHeight / 2, type: "bound" },
				{ value: imageHeight, type: "bound" },
			);

			// Points to check for snapping
			const xPoints = movingBox
				? [point.x, point.x + movingBox.w, point.x + movingBox.w / 2]
				: [point.x];
			const yPoints = movingBox
				? [point.y, point.y + movingBox.h, point.y + movingBox.h / 2]
				: [point.y];

			// Find best X snap
			let bestXSnap: { value: number; offset: number } | null = null;
			let minXDistance = snapConfig.threshold;

			for (let i = 0; i < xPoints.length; i++) {
				const checkX = xPoints[i];
				for (const target of verticalTargets) {
					const distance = Math.abs(checkX - target.value);
					if (distance < minXDistance) {
						minXDistance = distance;
						const boxW = movingBox?.w ?? 0;
						const offset = i === 0 ? 0 : i === 1 ? -boxW : -boxW / 2;
						bestXSnap = { value: target.value + offset, offset: target.value };
					}
				}
			}

			// Find best Y snap
			let bestYSnap: { value: number; offset: number } | null = null;
			let minYDistance = snapConfig.threshold;

			for (let i = 0; i < yPoints.length; i++) {
				const checkY = yPoints[i];
				for (const target of horizontalTargets) {
					const distance = Math.abs(checkY - target.value);
					if (distance < minYDistance) {
						minYDistance = distance;
						const boxH = movingBox?.h ?? 0;
						const offset = i === 0 ? 0 : i === 1 ? -boxH : -boxH / 2;
						bestYSnap = { value: target.value + offset, offset: target.value };
					}
				}
			}

			// Update guidelines
			const guidelines: Array<{
				type: "vertical" | "horizontal";
				position: number;
				start: number;
				end: number;
			}> = [];

			if (bestXSnap) {
				guidelines.push({
					type: "vertical",
					position: bestXSnap.offset,
					start: 0,
					end: imageHeight,
				});
			}

			if (bestYSnap) {
				guidelines.push({
					type: "horizontal",
					position: bestYSnap.offset,
					start: 0,
					end: imageWidth,
				});
			}

			setActiveGuidelines(guidelines);

			return {
				x: bestXSnap ? bestXSnap.value : point.x,
				y: bestYSnap ? bestYSnap.value : point.y,
			};
		},
		[setActiveGuidelines],
	);

	const clearGuidelines = useCallback(() => {
		clearActiveGuidelines();
	}, [clearActiveGuidelines]);

	// Edge-based snapping for resize operations
	const getResizeSnapResult = useCallback(
		(
			edges: { left: number; right: number; top: number; bottom: number },
			elements: EditorElement[],
			excludeId: ElementId,
			imageWidth: number,
			imageHeight: number,
		): {
			snapLeft: number | null;
			snapRight: number | null;
			snapTop: number | null;
			snapBottom: number | null;
			guidelines: Array<{ type: "vertical" | "horizontal"; position: number }>;
		} => {
			const verticalTargets = [0, imageWidth / 2, imageWidth];
			const horizontalTargets = [0, imageHeight / 2, imageHeight];

			for (const element of elements) {
				if (element.id === excludeId) continue;
				const { x, y, w, h } = element.bbox.pixel;
				verticalTargets.push(x, x + w, x + w / 2);
				horizontalTargets.push(y, y + h, y + h / 2);
			}

			const threshold = snapConfig.threshold;
			const guidelines: Array<{
				type: "vertical" | "horizontal";
				position: number;
			}> = [];

			let snapLeft: number | null = null;
			let snapRight: number | null = null;
			let snapTop: number | null = null;
			let snapBottom: number | null = null;

			for (const target of verticalTargets) {
				if (snapLeft === null && Math.abs(edges.left - target) < threshold) {
					snapLeft = target;
					guidelines.push({ type: "vertical", position: target });
				}
				if (snapRight === null && Math.abs(edges.right - target) < threshold) {
					snapRight = target;
					guidelines.push({ type: "vertical", position: target });
				}
			}

			for (const target of horizontalTargets) {
				if (snapTop === null && Math.abs(edges.top - target) < threshold) {
					snapTop = target;
					guidelines.push({ type: "horizontal", position: target });
				}
				if (
					snapBottom === null &&
					Math.abs(edges.bottom - target) < threshold
				) {
					snapBottom = target;
					guidelines.push({ type: "horizontal", position: target });
				}
			}

			setActiveGuidelines(
				guidelines.map((g) => ({
					...g,
					start: 0,
					end: g.type === "vertical" ? imageHeight : imageWidth,
				})),
			);

			return { snapLeft, snapRight, snapTop, snapBottom, guidelines };
		},
		[setActiveGuidelines],
	);

	return { getSnapResult, getResizeSnapResult, clearGuidelines };
}
