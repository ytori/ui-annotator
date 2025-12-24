import { ImageIcon, Lock, SquareMousePointer, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AppLogoWithText } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/error";

export interface ImageUploaderProps {
	/** Accept pattern for file input (e.g., "image/*,.zip") */
	acceptPattern: string;
	/** Function to check if a file is acceptable */
	isAcceptableFile: (file: File) => boolean;
	/** Handler for opening an image file */
	onOpen?: (file: File) => void;
}

export function ImageUploader({
	acceptPattern,
	isAcceptableFile,
	onOpen,
}: ImageUploaderProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const dragCounterRef = useRef(0);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			dragCounterRef.current = 0;
			const file = e.dataTransfer.files[0];
			if (file) {
				if (isAcceptableFile(file)) {
					onOpen?.(file);
				} else {
					showError(
						"Unsupported file type",
						"Please select an image or project file",
					);
				}
			}
		},
		[isAcceptableFile, onOpen],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		dragCounterRef.current++;
		if (e.dataTransfer.types.includes("Files")) {
			setIsDragging(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		dragCounterRef.current--;
		if (dragCounterRef.current === 0) {
			setIsDragging(false);
		}
	}, []);

	return (
		<div className="flex h-full w-full items-center justify-center pb-16">
			<div className="flex w-full max-w-lg flex-col items-center px-6">
				{/* Logo */}
				<AppLogoWithText className="mb-5 scale-110" />

				{/* Hero section */}
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-extrabold leading-tight tracking-normal text-neutral-900 dark:text-neutral-50">
						Turn screenshots into
						<br />
						AI-ready UI specs
					</h1>
					<p className="mt-4 text-neutral-500 dark:text-neutral-400">
						Draw boxes, pick components, and export JSON / Prompt
					</p>
				</div>

				{/* Drop zone */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: Drop zone for drag and drop file upload */}
				<div
					className={`relative flex w-full flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-8 transition-all duration-200 ${
						isDragging
							? "border-primary bg-primary/5 scale-[1.02]"
							: "border-neutral-300 bg-neutral-50/50 dark:border-neutral-700 dark:bg-neutral-900/50"
					}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
				>
					{/* Icon */}
					<div className="relative h-14 w-14">
						<div
							className={`absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 transition-opacity duration-200 dark:from-neutral-700 dark:to-neutral-800 ${
								isDragging ? "opacity-0" : "opacity-100"
							}`}
						>
							<ImageIcon className="h-7 w-7 text-neutral-600 dark:text-neutral-300" />
						</div>
						<div
							className={`absolute inset-0 flex items-center justify-center rounded-full bg-primary/10 transition-opacity duration-200 ${
								isDragging ? "opacity-100" : "opacity-0"
							}`}
						>
							<Upload className="h-7 w-7 text-primary" />
						</div>
					</div>

					{/* Text */}
					<div className="relative h-6 w-full">
						<div
							className={`absolute inset-0 flex items-center justify-center text-center transition-opacity duration-200 ${
								isDragging ? "opacity-0" : "opacity-100"
							}`}
						>
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								Drop a screenshot here
							</p>
						</div>
						<div
							className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
								isDragging ? "opacity-100" : "opacity-0"
							}`}
						>
							<p className="font-medium text-primary">Drop here</p>
						</div>
					</div>

					{/* Button */}
					<Button
						size="lg"
						onClick={() => fileInputRef.current?.click()}
						className={`mt-1 gap-2 transition-opacity duration-200 ${
							isDragging ? "pointer-events-none opacity-0" : "opacity-100"
						}`}
					>
						<SquareMousePointer className="h-4 w-4" />
						Start Annotating
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept={acceptPattern}
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) onOpen?.(file);
							e.target.value = "";
						}}
					/>
				</div>

				{/* Privacy notice */}
				<p className="mt-4 text-center text-xs text-neutral-400">
					<Lock className="mr-1 inline h-3 w-3" />
					Your images & annotations stay on your device, never uploaded.
				</p>
			</div>
		</div>
	);
}
