import { useCallback, useState } from "react";
import { BottomToolbar, EditorHeader, HelpButton } from "@/features/annotation";
import {
  KonvaCanvas,
  MobileToolSwitcher,
  useKeyboardShortcuts,
} from "@/features/annotation/canvas";
import { LayerSheet } from "@/features/annotation/components/panels/layer-sheet";
import { PropertiesSheet } from "@/features/annotation/components/panels/properties-sheet";
import {
  ComponentPropertyEditor,
  ComponentsDialog,
} from "@/features/component-catalog";
import { ExportDialog } from "@/features/export";
import { useFileInputConfig } from "../../hooks/use-file-input-config";
import { useToolbarActions } from "../../hooks/use-toolbar-actions";
import { AnnotationProvider } from "../../providers/annotation-provider";

export function MobileEditorView() {
  useKeyboardShortcuts();

  const { handleOpen, handleSave, exportInput } = useToolbarActions();
  const { acceptPattern } = useFileInputConfig();

  // Sheet states
  const [layerSheetOpen, setLayerSheetOpen] = useState(false);
  const [propertiesSheetOpen, setPropertiesSheetOpen] = useState(false);

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [componentLibraryOpen, setComponentLibraryOpen] = useState(false);

  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleComponentLibrary = useCallback(() => {
    setComponentLibraryOpen(true);
  }, []);

  return (
    <AnnotationProvider>
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <EditorHeader
          acceptPattern={acceptPattern}
          compact
          onExport={handleExport}
          onImportComponentLibrary={handleComponentLibrary}
          onOpen={handleOpen}
          onSave={handleSave}
        />

        {/* Canvas - Full screen */}
        <div className="canvas-background relative flex-1 overflow-hidden">
          <KonvaCanvas />
          <MobileToolSwitcher />
          <HelpButton />
        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar
          onLayersClick={() => setLayerSheetOpen(true)}
          onPropertiesClick={() => setPropertiesSheetOpen(true)}
        />

        {/* Layer Sheet */}
        <LayerSheet onOpenChange={setLayerSheetOpen} open={layerSheetOpen} />

        {/* Properties Sheet */}
        <PropertiesSheet
          onOpenChange={setPropertiesSheetOpen}
          open={propertiesSheetOpen}
          renderComponentEditor={(props) => (
            <ComponentPropertyEditor {...props} />
          )}
        />

        {/* Export Dialog */}
        <ExportDialog
          input={exportInput}
          onOpenChange={setExportDialogOpen}
          open={exportDialogOpen}
        />

        {/* Components Dialog */}
        <ComponentsDialog
          onOpenChange={setComponentLibraryOpen}
          open={componentLibraryOpen}
        />
      </div>
    </AnnotationProvider>
  );
}
