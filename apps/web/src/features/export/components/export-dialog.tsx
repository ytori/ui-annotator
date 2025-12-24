/**
 * Export Dialog
 *
 * Modal dialog for exporting annotation data.
 * Uses the plugin system to support multiple export formats.
 */

import { AlertTriangle, Check, ClipboardCopy, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/lib/error";
import { exportPluginManager } from "../services/plugin-manager";
import type {
  ExporterMeta,
  ExportInput,
  ExportResult,
  ValidationResult,
} from "../types";

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: ExportInput | null;
}

export function ExportDialog({ open, onOpenChange, input }: ExportDialogProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("prompt");
  const [previewContent, setPreviewContent] = useState<string>("");
  const [warningCount, setWarningCount] = useState(0);

  // Get available formats from plugin system
  const formats = useMemo<ExporterMeta[]>(
    () => exportPluginManager.getPlugins().map((p) => p.meta),
    []
  );

  // Check for validation warnings
  useEffect(() => {
    if (!input) {
      setWarningCount(0);
      return;
    }

    const validation: ValidationResult = exportPluginManager.validate(
      activeTab,
      input
    );
    setWarningCount(validation.invalidElementIds.length);
  }, [activeTab, input]);

  // Update preview when tab changes or input changes
  useEffect(() => {
    if (!input) {
      setPreviewContent("");
      return;
    }

    let cancelled = false;

    exportPluginManager
      .export(activeTab, input)
      .then((result: ExportResult) => {
        if (cancelled) {
          return;
        }

        if (result.success && result.content) {
          // Limit preview length
          const maxLength = 2000;
          if (result.content.length > maxLength) {
            setPreviewContent(
              `${result.content.slice(0, maxLength)}...\n\n(truncated)`
            );
          } else {
            setPreviewContent(result.content);
          }
        } else {
          setPreviewContent(result.error || "Failed to generate preview");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, input]);

  const handleCopy = useCallback(
    async (formatId: string) => {
      if (!input) {
        return;
      }

      try {
        const result: ExportResult = await exportPluginManager.export(
          formatId,
          input
        );
        if (!(result.success && result.content)) {
          showError("Export failed", result.error || "Unknown error");
          return;
        }

        await navigator.clipboard.writeText(result.content);
        setCopiedFormat(formatId);
        setTimeout(() => setCopiedFormat(null), 2000);

        const format = formats.find((f) => f.id === formatId);
        showSuccess(
          "Copied to clipboard",
          `${format?.name || formatId} copied`
        );
      } catch {
        showError("Copy failed", "Could not access clipboard");
      }
    },
    [input, formats]
  );

  const handleDownload = useCallback(
    async (formatId: string) => {
      if (!input) {
        return;
      }

      try {
        await exportPluginManager.download(formatId, input);
        const format = formats.find((f: ExporterMeta) => f.id === formatId);
        showSuccess("Download started", format?.name || formatId);
      } catch (err) {
        showError(
          "Download failed",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    },
    [input, formats]
  );

  if (!input) {
    return null;
  }

  const isCopied = copiedFormat === activeTab;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export for AI</DialogTitle>
          <DialogDescription>
            Export annotation data in various formats for AI integration.
          </DialogDescription>
        </DialogHeader>

        <Tabs className="mt-4" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2">
            {formats.map((format) => (
              <TabsTrigger key={format.id} value={format.id}>
                {format.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {formats.map((format) => (
            <TabsContent className="mt-4" key={format.id} value={format.id}>
              <div className="min-w-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  {format.description}
                </p>
                {warningCount > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-600 text-sm dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {warningCount} element{warningCount > 1 ? "s" : ""}{" "}
                      missing label
                    </span>
                  </div>
                )}
                <div className="max-h-[300px] overflow-auto rounded-md border bg-muted/50 p-4">
                  <pre className="w-0 min-w-full whitespace-pre-wrap break-words text-xs">
                    {previewContent}
                  </pre>
                </div>
                <div className="flex gap-2">
                  {format.supportsClipboard !== false && (
                    <Button
                      className="flex-1"
                      onClick={() => handleCopy(format.id)}
                      variant={isCopied ? "secondary" : "default"}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          {`Copy ${format.name}`}
                        </>
                      )}
                    </Button>
                  )}
                  {format.supportsDownload !== false && (
                    <Button
                      className="flex-1"
                      onClick={() => handleDownload(format.id)}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
