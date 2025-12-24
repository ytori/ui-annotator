import { FolderOpen, Menu } from "lucide-react";
import { useRef } from "react";
import {
	GithubMenuItems,
	ThemeMenuItems,
} from "@/components/common/menu-items";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploader } from "@/features/annotation";
import { useFileInputConfig } from "../../hooks/use-file-input-config";
import { useToolbarActions } from "../../hooks/use-toolbar-actions";

export function WelcomeView() {
	const { handleOpen } = useToolbarActions();
	const { acceptPattern, isAcceptableFile } = useFileInputConfig();

	return (
		<div className="canvas-background relative flex h-full items-center justify-center">
			<WelcomeMenu acceptPattern={acceptPattern} onOpen={handleOpen} />
			<ImageUploader
				acceptPattern={acceptPattern}
				isAcceptableFile={isAcceptableFile}
				onOpen={handleOpen}
			/>
		</div>
	);
}

function WelcomeMenu({
	acceptPattern,
	onOpen,
}: {
	acceptPattern: string;
	onOpen: (file: File) => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="absolute right-4 top-4">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<Menu className="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
						<FolderOpen className="mr-2 h-4 w-4" />
						Open
					</DropdownMenuItem>
					<ThemeMenuItems />
					<GithubMenuItems />
				</DropdownMenuContent>
			</DropdownMenu>
			<input
				ref={fileInputRef}
				type="file"
				accept={acceptPattern}
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) onOpen(file);
					e.target.value = "";
				}}
			/>
		</div>
	);
}
