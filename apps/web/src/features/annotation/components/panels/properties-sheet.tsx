import type { ReactNode } from "react";
import { BaseSheet } from "./base-sheet";
import { type ComponentEditorProps, PropertiesPanel } from "./properties-panel";

export interface PropertiesSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	renderComponentEditor?: (props: ComponentEditorProps) => ReactNode;
}

export function PropertiesSheet({
	open,
	onOpenChange,
	renderComponentEditor,
}: PropertiesSheetProps) {
	return (
		<BaseSheet open={open} onOpenChange={onOpenChange} title="Properties">
			<PropertiesPanel
				showHeader={false}
				renderComponentEditor={renderComponentEditor}
				onDeleted={() => onOpenChange(false)}
			/>
		</BaseSheet>
	);
}
