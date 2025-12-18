import { Label } from "@/components/ui/label";
import type { ComponentSpec } from "@/types/component";
import { ComponentCombobox } from "./component-combobox";

export interface ComponentPropertyEditorProps {
	value: ComponentSpec | undefined;
	onValueChange: (spec: ComponentSpec | null) => void;
}

/**
 * Integrated component property editor
 *
 * Provides a unified interface for selecting component name.
 */
export function ComponentPropertyEditor({
	value,
	onValueChange,
}: ComponentPropertyEditorProps) {
	const handleComponentChange = (name: string) => {
		if (!name) {
			onValueChange(null);
		} else {
			onValueChange({
				...value,
				name,
			});
		}
	};

	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">Component</Label>
			<ComponentCombobox
				value={value?.name ?? ""}
				onValueChange={handleComponentChange}
			/>
		</div>
	);
}
