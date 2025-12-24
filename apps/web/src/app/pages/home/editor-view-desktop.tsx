import { Layers, Settings } from "lucide-react";
import { useCallback, useState } from "react";
import { ResizableSidebar } from "@/components/common/resizable-sidebar";
import {
  EditorHeader,
  HelpButton,
  LayerPanel,
  PropertiesPanel,
  selectSelectedIds,
  useAnnotationStore,
} from "@/features/annotation";
import {
  FloatingToolbar,
  KonvaCanvas,
  useKeyboardShortcuts,
  ZoomControls,
} from "@/features/annotation/canvas";
import {
  ComponentPropertyEditor,
  ComponentsDialog,
} from "@/features/component-catalog";
import { ExportDialog } from "@/features/export";
import { useFileInputConfig } from "../../hooks/use-file-input-config";
import { useToolbarActions } from "../../hooks/use-toolbar-actions";
import { AnnotationProvider } from "../../providers/annotation-provider";

export function DesktopEditorView() {
  useKeyboardShortcuts();

  const selectedIds = useAnnotationStore(selectSelectedIds);
  const { handleOpen, handleSave, exportInput } = useToolbarActions();
  const { acceptPattern } = useFileInputConfig();

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
        <EditorHeader
          acceptPattern={acceptPattern}
          onExport={handleExport}
          onImportComponentLibrary={handleComponentLibrary}
          onOpen={handleOpen}
          onSave={handleSave}
        />
        <div className="relative flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <ResizableSidebar
            collapsedIcon={Layers}
            collapsedTitle="Expand layers"
            position="left"
          >
            <LayerPanel />
          </ResizableSidebar>

          {/* Canvas area */}
          <div className="canvas-background relative flex-1 overflow-hidden">
            <KonvaCanvas />
            <FloatingToolbar />
            <ZoomControls />
            <HelpButton />
          </div>

          {/* Right sidebar */}
          <ResizableSidebar
            collapsedIcon={Settings}
            collapsedTitle="Expand properties"
            expandTrigger={selectedIds.length}
            position="right"
          >
            <PropertiesPanel
              renderComponentEditor={(props) => (
                <ComponentPropertyEditor {...props} />
              )}
            />
          </ResizableSidebar>
        </div>
      </div>

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
    </AnnotationProvider>
  );
}
