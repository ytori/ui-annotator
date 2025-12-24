import { BookOpen, Pencil, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useComponentCatalogStore, useSources } from "../store";

/** Regex to remove .json extension (case-insensitive) */
const JSON_EXTENSION_REGEX = /\.json$/i;

export interface ComponentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComponentsDialog({
  open,
  onOpenChange,
}: ComponentsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const sources = useSources();
  const importManifest = useComponentCatalogStore((s) => s.importManifest);
  const removeSource = useComponentCatalogStore((s) => s.removeSource);
  const toggleSource = useComponentCatalogStore((s) => s.toggleSource);
  const updateSourceName = useComponentCatalogStore((s) => s.updateSourceName);

  // Imported sources (already in "newest first" order from useSources)
  const importedSources = sources.filter((s) => !s.isBuiltin);

  // Builtin source
  const builtinSource = sources.find((s) => s.isBuiltin);

  // Import file immediately
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const text = await file.text();
        const name = file.name.replace(JSON_EXTENSION_REGEX, "");
        importManifest(name, text);
        toast.success(`Imported "${name}"`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to import file");
      }
    },
    [importManifest]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) {
        return;
      }

      // Check by MIME type or file extension (some browsers return empty MIME type)
      const isJson =
        file.type === "application/json" ||
        file.name.toLowerCase().endsWith(".json");

      if (isJson) {
        handleFile(file);
      } else {
        setError("Please drop a JSON file");
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const startEditing = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  }, []);

  const confirmEdit = useCallback(() => {
    if (editingId && editingName.trim()) {
      updateSourceName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, updateSourceName]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setError(null);
        setEditingId(null);
        setEditingName("");
        setDeleteTarget(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      removeSource(deleteTarget.id);
      toast.success(`Removed "${deleteTarget.name}"`);
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeSource]);

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Components</DialogTitle>
            <DialogDescription>
              Import component definitions to use in annotations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* File drop zone */}
            <input
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Drop zone */}
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
						`}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-muted-foreground text-sm">
                Drop component manifest JSON here
              </p>
              <p className="mb-3 text-muted-foreground/70 text-xs">
                Supports: Storybook{" "}
                <a
                  className="underline hover:text-foreground"
                  href="https://storybook.js.org/docs/api/main-config/main-config-indexers"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  index.json
                </a>
                {" / "}
                <a
                  className="underline hover:text-foreground"
                  href="https://storybook.js.org/addons/@storybook/addon-mcp"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  components.json
                </a>
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </div>

            {error && (
              <p className="rounded bg-destructive/10 p-2 text-destructive text-sm">
                {error}
              </p>
            )}

            {/* Component sources list */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Imported Components</h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {/* Imported sources */}
                {importedSources.map((source) => (
                  <div
                    className="flex items-center gap-3 rounded bg-muted/50 px-3 py-2.5 text-sm"
                    key={source.id}
                  >
                    <Checkbox
                      checked={source.enabled}
                      id={`source-${source.id}`}
                      onCheckedChange={(checked) =>
                        toggleSource(source.id, checked === true)
                      }
                    />
                    {editingId === source.id ? (
                      <div className="min-w-0 flex-1">
                        <Input
                          autoFocus
                          className="h-7 text-sm"
                          onBlur={() => {
                            if (editingName.trim()) {
                              confirmEdit();
                            } else {
                              cancelEdit();
                            }
                          }}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingName.trim()) {
                              confirmEdit();
                            }
                            if (e.key === "Escape") {
                              cancelEdit();
                            }
                          }}
                          value={editingName}
                        />
                        {source.parseError ? (
                          <p className="mt-0.5 text-destructive text-xs">
                            {source.parseError}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-muted-foreground text-xs">
                            {source.components.length} components
                          </p>
                        )}
                      </div>
                    ) : (
                      <label
                        className="min-w-0 flex-1 cursor-pointer"
                        htmlFor={`source-${source.id}`}
                      >
                        <span
                          className="inline-flex items-center rounded border px-1.5 py-0.5 font-medium text-xs"
                          style={{
                            borderColor: source.color,
                            color: source.color,
                          }}
                        >
                          {source.name}
                        </span>
                        {source.parseError ? (
                          <p className="mt-1 text-destructive text-xs">
                            {source.parseError}
                          </p>
                        ) : (
                          <p className="mt-1 text-muted-foreground text-xs">
                            {source.components.length} components
                          </p>
                        )}
                      </label>
                    )}
                    {editingId !== source.id && (
                      <div className="flex items-center">
                        <Button
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(source.id, source.name)}
                          size="sm"
                          variant="ghost"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              id: source.id,
                              name: source.name,
                            })
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Built-in source (always last) */}
                {builtinSource && (
                  <div className="flex items-center gap-3 rounded bg-muted/50 px-3 py-2.5 text-sm">
                    <Checkbox
                      checked={builtinSource.enabled}
                      id="source-builtin"
                      onCheckedChange={(checked) =>
                        toggleSource("builtin", checked === true)
                      }
                    />
                    <label
                      className="min-w-0 flex-1 cursor-pointer"
                      htmlFor="source-builtin"
                    >
                      <span
                        className="inline-flex items-center rounded border px-1.5 py-0.5 font-medium text-xs"
                        style={{
                          borderColor: builtinSource.color,
                          color: builtinSource.color,
                        }}
                      >
                        {builtinSource.name}
                      </span>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {builtinSource.components.length} components
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        open={deleteTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove component source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteTarget?.name}" from your imported
              components. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleConfirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
