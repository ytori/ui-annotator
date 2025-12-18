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
import { Button } from "@/components/ui/button";
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
				const name = file.name.replace(/\.json$/i, "");
				importManifest(name, text);
				toast.success(`Imported "${name}"`);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to import file");
			}
		},
		[importManifest],
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
			e.target.value = "";
		},
		[handleFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (!file) return;

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
		[handleFile],
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
		[onOpenChange],
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
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Components</DialogTitle>
						<DialogDescription>
							Import component definitions to use in annotations.
						</DialogDescription>
					</DialogHeader>
					<div className="py-2 space-y-4">
						{/* File drop zone */}
						<input
							ref={fileInputRef}
							type="file"
							accept=".json,application/json"
							onChange={handleFileChange}
							className="hidden"
						/>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Drop zone */}
						<div
							className={`
							border-2 border-dashed rounded-lg p-6 text-center transition-colors
							${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
						`}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
						>
							<BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
							<p className="text-sm text-muted-foreground mb-2">
								Drop component manifest JSON here
							</p>
							<p className="text-xs text-muted-foreground/70 mb-3">
								Supports: Storybook{" "}
								<a
									href="https://storybook.js.org/docs/api/main-config/main-config-indexers"
									target="_blank"
									rel="noopener noreferrer"
									className="underline hover:text-foreground"
								>
									index.json
								</a>
								{" / "}
								<a
									href="https://storybook.js.org/addons/@storybook/addon-mcp"
									target="_blank"
									rel="noopener noreferrer"
									className="underline hover:text-foreground"
								>
									components.json
								</a>
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
							>
								<Upload className="h-4 w-4 mr-2" />
								Select File
							</Button>
						</div>

						{error && (
							<p className="text-sm text-destructive bg-destructive/10 rounded p-2">
								{error}
							</p>
						)}

						{/* Component sources list */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Imported Components</h4>
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{/* Imported sources */}
								{importedSources.map((source) => (
									<div
										key={source.id}
										className="flex items-center gap-3 px-3 py-2.5 rounded bg-muted/50 text-sm"
									>
										<Checkbox
											id={`source-${source.id}`}
											checked={source.enabled}
											onCheckedChange={(checked) =>
												toggleSource(source.id, checked === true)
											}
										/>
										{editingId === source.id ? (
											<div className="flex-1 min-w-0">
												<Input
													value={editingName}
													onChange={(e) => setEditingName(e.target.value)}
													className="h-7 text-sm"
													autoFocus
													onBlur={() => {
														if (editingName.trim()) confirmEdit();
														else cancelEdit();
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter" && editingName.trim())
															confirmEdit();
														if (e.key === "Escape") cancelEdit();
													}}
												/>
												{source.parseError ? (
													<p className="text-xs text-destructive mt-0.5">
														{source.parseError}
													</p>
												) : (
													<p className="text-xs text-muted-foreground mt-0.5">
														{source.components.length} components
													</p>
												)}
											</div>
										) : (
											<label
												htmlFor={`source-${source.id}`}
												className="flex-1 min-w-0 cursor-pointer"
											>
												<span
													className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium"
													style={{
														borderColor: source.color,
														color: source.color,
													}}
												>
													{source.name}
												</span>
												{source.parseError ? (
													<p className="text-xs text-destructive mt-1">
														{source.parseError}
													</p>
												) : (
													<p className="text-xs text-muted-foreground mt-1">
														{source.components.length} components
													</p>
												)}
											</label>
										)}
										{editingId !== source.id && (
											<div className="flex items-center">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => startEditing(source.id, source.name)}
													className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
												>
													<Pencil className="h-3.5 w-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														setDeleteTarget({
															id: source.id,
															name: source.name,
														})
													}
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										)}
									</div>
								))}

								{/* Built-in source (always last) */}
								{builtinSource && (
									<div className="flex items-center gap-3 px-3 py-2.5 rounded bg-muted/50 text-sm">
										<Checkbox
											id="source-builtin"
											checked={builtinSource.enabled}
											onCheckedChange={(checked) =>
												toggleSource("builtin", checked === true)
											}
										/>
										<label
											htmlFor="source-builtin"
											className="flex-1 min-w-0 cursor-pointer"
										>
											<span
												className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium"
												style={{
													borderColor: builtinSource.color,
													color: builtinSource.color,
												}}
											>
												{builtinSource.name}
											</span>
											<p className="text-xs text-muted-foreground mt-1">
												{builtinSource.components.length} components
											</p>
										</label>
									</div>
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
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
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
