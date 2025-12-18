import { Box, Check, ChevronsUpDown, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { showError } from "@/lib/error";
import { componentNameSchema } from "@/types";
import { useSourceGroups } from "../store";

/**
 * Validate custom component name using Zod schema.
 * Returns validated name or null with error toast.
 */
function validateComponentName(name: string): string | null {
	const trimmed = name.trim();
	const result = componentNameSchema.safeParse(trimmed);

	if (!result.success) {
		const error = result.error.issues[0]?.message ?? "Invalid component name";
		showError(error);
		return null;
	}

	return result.data;
}

export interface ComponentComboboxProps {
	value: string;
	onValueChange: (value: string) => void;
}

export function ComponentCombobox({
	value,
	onValueChange,
}: ComponentComboboxProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const sourceGroups = useSourceGroups();

	// All components for filtering
	const allComponents = useMemo(
		() =>
			sourceGroups.flatMap((s) => s.categories.flatMap((c) => c.components)),
		[sourceGroups],
	);

	// Filter by search
	const filteredSources = useMemo(() => {
		if (!search) return sourceGroups;

		const lowerQuery = search.toLowerCase();
		const filteredNames = new Set(
			allComponents
				.filter(
					(c) =>
						c.name.toLowerCase().includes(lowerQuery) ||
						c.description.toLowerCase().includes(lowerQuery) ||
						c.category.toLowerCase().includes(lowerQuery),
				)
				.map((c) => c.name),
		);

		return sourceGroups
			.map((group) => ({
				...group,
				categories: group.categories
					.map((cat) => ({
						...cat,
						components: cat.components.filter((c) => filteredNames.has(c.name)),
					}))
					.filter((cat) => cat.components.length > 0),
			}))
			.filter((group) => group.categories.length > 0);
	}, [sourceGroups, allComponents, search]);

	const selectedComponent = useMemo(
		() =>
			allComponents.find((c) => c.name.toLowerCase() === value.toLowerCase()),
		[allComponents, value],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && search && filteredSources.length === 0) {
				e.preventDefault();
				const validated = validateComponentName(search);
				if (validated) {
					onValueChange(validated);
					setOpen(false);
					setSearch("");
				}
			}
		},
		[search, filteredSources.length, onValueChange],
	);

	const handleButtonKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
				e.preventDefault();
				setOpen(true);
				return;
			}
			if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
				e.preventDefault();
				setSearch(e.key);
				setOpen(true);
			}
		},
		[open],
	);

	const handleSearchChange = useCallback(
		(newValue: string) => {
			setSearch(newValue);
			if (newValue && !open) setOpen(true);
		},
		[open],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between h-8 text-sm"
					onKeyDown={handleButtonKeyDown}
				>
					<span className="flex items-center gap-2 truncate">
						{selectedComponent ? (
							<>
								<selectedComponent.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
								<span>{selectedComponent.name}</span>
							</>
						) : value ? (
							<>
								<Box className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
								<span>{value}</span>
							</>
						) : (
							<span className="text-muted-foreground">Select component...</span>
						)}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[280px] p-0" align="start" side="bottom">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search components..."
						value={search}
						onValueChange={handleSearchChange}
						onKeyDown={handleKeyDown}
					/>
					<CommandList>
						{value && !search && (
							<CommandGroup>
								<CommandItem
									value="__clear__"
									onSelect={() => {
										onValueChange("");
										setOpen(false);
									}}
									className="text-muted-foreground"
								>
									<X className="mr-2 h-4 w-4" />
									<span>Clear selection</span>
								</CommandItem>
							</CommandGroup>
						)}
						<CommandEmpty>
							{search && (
								<button
									type="button"
									className="flex w-full items-center gap-2 p-2 text-sm text-left hover:bg-accent"
									onClick={() => {
										const validated = validateComponentName(search);
										if (validated) {
											onValueChange(validated);
											setOpen(false);
											setSearch("");
										}
									}}
								>
									<Box className="h-4 w-4 text-muted-foreground" />
									<span>
										Use custom: "<strong>{search}</strong>"
									</span>
								</button>
							)}
							{!search && "No component found."}
						</CommandEmpty>
						{filteredSources.map((group, idx) => (
							<div key={group.id}>
								{idx > 0 && <CommandSeparator />}
								<div className="sticky top-0 z-10 flex items-center gap-2 px-2 py-2 bg-background border-b">
									<span
										className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium"
										style={{ borderColor: group.color, color: group.color }}
									>
										{group.name}
									</span>
								</div>
								{group.categories.map(({ category, components }) => (
									<CommandGroup key={category} heading={category}>
										{components.map((component) => (
											<CommandItem
												key={component.name}
												value={component.name}
												onSelect={() => {
													onValueChange(component.name);
													setOpen(false);
													setSearch("");
												}}
											>
												<component.icon className="mr-2 h-4 w-4 text-muted-foreground" />
												<span className="flex-1">{component.name}</span>
												<span className="text-xs text-muted-foreground truncate max-w-[100px]">
													{component.description}
												</span>
												{value.toLowerCase() ===
													component.name.toLowerCase() && (
													<Check className="ml-2 h-4 w-4" />
												)}
											</CommandItem>
										))}
									</CommandGroup>
								))}
							</div>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
