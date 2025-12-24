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
    <BaseSheet onOpenChange={onOpenChange} open={open} title="Properties">
      <PropertiesPanel
        onDeleted={() => onOpenChange(false)}
        renderComponentEditor={renderComponentEditor}
        showHeader={false}
      />
    </BaseSheet>
  );
}
