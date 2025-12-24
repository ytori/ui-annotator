import { FileUp, ImageIcon } from "lucide-react";
import { useRef } from "react";
import { AppLogo, AppLogoWithText } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { selectProject, useAnnotationStore } from "../../store";
import { EditorMenu } from "./editor-menu";

/**
 * Props for EditorHeader
 * All file/export operations are injected from outside
 */
export interface EditorHeaderProps {
	/** Accept pattern for file input */
	acceptPattern: string;
	/** Handler for opening an image or project file */
	onOpen?: (file: File) => void;
	/** Handler for saving project */
	onSave?: () => void;
	/** Handler for exporting for AI */
	onExport?: () => void;
	/** Handler for opening component library dialog */
	onImportComponentLibrary?: () => void;
	/** Compact mode for mobile (smaller height, logo only) */
	compact?: boolean;
}

export function EditorHeader({
	acceptPattern,
	onOpen,
	onSave,
	onExport,
	onImportComponentLibrary,
	compact = false,
}: EditorHeaderProps) {
	const project = useAnnotationStore(selectProject);
	const clearProject = useAnnotationStore((state) => state.clearProject);
	const openInputRef = useRef<HTMLInputElement>(null);

	return (
		<div
			className={cn(
				"flex items-center justify-between border-b",
				compact
					? "h-10 bg-background px-3"
					: "h-12 border-neutral-200/80 bg-gradient-to-r from-background via-background to-neutral-50/50 px-4 dark:border-neutral-800 dark:to-neutral-900/50",
			)}
		>
			{/* Left: Logo */}
			{compact ? (
				<AppLogo className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
			) : (
				<AppLogoWithText />
			)}

			{/* Center: File name */}
			{project && (
				<div
					className={cn(
						"flex items-center text-muted-foreground text-sm",
						compact ? "gap-1.5" : "gap-2",
					)}
				>
					<ImageIcon className="h-4 w-4" />
					<span
						className={cn(
							"truncate",
							compact ? "max-w-[180px]" : "max-w-[300px]",
						)}
					>
						{project.name}
					</span>
				</div>
			)}

			{/* Right: Export button + Menu */}
			<div className="flex items-center gap-4">
				{project && !compact && (
					<Button
						className="gap-1.5"
						onClick={onExport}
						size="sm"
						variant="default"
					>
						<FileUp className="h-4 w-4" />
						Export for AI
					</Button>
				)}
				<EditorMenu
					hasProject={!!project}
					onClear={clearProject}
					onExport={onExport}
					onImportComponentLibrary={onImportComponentLibrary}
					onOpen={() => openInputRef.current?.click()}
					onSave={onSave}
				/>
			</div>

			<input
				accept={acceptPattern}
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file && onOpen) onOpen(file);
					e.target.value = "";
				}}
				ref={openInputRef}
				type="file"
			/>
		</div>
	);
}
