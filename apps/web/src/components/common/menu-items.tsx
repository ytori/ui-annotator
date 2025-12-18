import { Monitor, Moon, Sun } from "lucide-react";
import { GithubIcon } from "@/components/common/icons";
import { useTheme } from "@/components/common/theme-provider";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Theme selection menu items
 * Includes separator, label, and radio group
 */
export function ThemeMenuItems() {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
				Theme
			</DropdownMenuLabel>
			<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
				<DropdownMenuRadioItem value="light">
					<Sun className="mr-2 h-4 w-4" />
					Light
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem value="dark">
					<Moon className="mr-2 h-4 w-4" />
					Dark
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem value="system">
					<Monitor className="mr-2 h-4 w-4" />
					System
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</>
	);
}

/**
 * GitHub link menu items
 * Only renders if VITE_GITHUB_URL is set
 */
export function GithubMenuItems() {
	if (!import.meta.env.VITE_GITHUB_URL) {
		return null;
	}

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuItem asChild>
				<a
					href={import.meta.env.VITE_GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					<GithubIcon className="mr-2 h-4 w-4" />
					GitHub
				</a>
			</DropdownMenuItem>
		</>
	);
}
