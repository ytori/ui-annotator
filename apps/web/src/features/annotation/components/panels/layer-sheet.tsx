import { BaseSheet } from "./base-sheet";
import { LayerPanel } from "./layer-panel";

export interface LayerSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LayerSheet({ open, onOpenChange }: LayerSheetProps) {
	return (
		<BaseSheet open={open} onOpenChange={onOpenChange} title="Annotations">
			<LayerPanel showHeader={false} />
		</BaseSheet>
	);
}
