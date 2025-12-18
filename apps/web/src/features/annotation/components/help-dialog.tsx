"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	KEYBOARD_SHORTCUTS,
	type Shortcut,
	type ShortcutGroup,
} from "../constants/shortcuts";

interface HelpDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Render a single key as a styled kbd element.
 */
function Key({ children }: { children: string }) {
	if (children === "+") {
		return <span className="text-muted-foreground text-xs">+</span>;
	}
	return (
		<kbd className="bg-muted text-muted-foreground inline-flex min-w-5 items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium">
			{children}
		</kbd>
	);
}

/**
 * Render a sequence of keys.
 */
function KeySequence({
	keys,
	prefix = "",
}: {
	keys: string[];
	prefix?: string;
}) {
	return (
		<span className="inline-flex items-center gap-0.5">
			{keys.map((key, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Keys can contain duplicates (e.g., multiple "+"), so index is needed for uniqueness
				<Key key={`${prefix}${idx}`}>{key}</Key>
			))}
		</span>
	);
}

/**
 * Render a shortcut row with keys and description.
 */
function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
	const macKeys = shortcut.macKeys;
	const hasMacKeys = macKeys && macKeys.length > 0;

	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<div className="flex items-center gap-2">
				{hasMacKeys ? (
					<>
						<KeySequence keys={shortcut.keys} prefix="win-" />
						<span className="text-muted-foreground text-xs">/</span>
						<KeySequence keys={macKeys} prefix="mac-" />
					</>
				) : (
					<KeySequence keys={shortcut.keys} />
				)}
			</div>
			<span className="text-muted-foreground text-right text-sm">
				{shortcut.description}
			</span>
		</div>
	);
}

/**
 * Render a group of shortcuts with a title.
 */
function ShortcutGroupSection({ group }: { group: ShortcutGroup }) {
	return (
		<div className="space-y-1">
			<h4 className="text-foreground text-xs font-medium">{group.title}</h4>
			<div className="divide-border divide-y">
				{group.shortcuts.map((shortcut) => (
					<ShortcutRow key={shortcut.description} shortcut={shortcut} />
				))}
			</div>
		</div>
	);
}

const GETTING_STARTED_STEPS = [
	{
		step: 1,
		title: "Draw annotation boxes",
		details: [
			"Drag on the canvas to draw boxes around UI elements",
			"Hold Alt (Option) to draw over existing elements",
			"Use arrow keys to fine-tune position (Shift for 10px)",
		],
	},
	{
		step: 2,
		title: "Edit properties",
		details: [
			"Click to select, double-click to cycle overlapping elements",
			"Press Enter to edit label (auto-numbered #1, #2... if empty)",
			"Set component type and notes in the properties panel",
		],
	},
	{
		step: 3,
		title: "Export for AI",
		details: [
			"Click 'Export for AI' button in the toolbar",
			"Choose format: JSON or AI Prompt (Markdown)",
			"Copy to clipboard or download as file",
		],
	},
];

/**
 * Help dialog with accordion sections for getting started guide and keyboard shortcuts.
 */
export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Help</DialogTitle>
				</DialogHeader>
				<Accordion type="multiple" defaultValue={["getting-started"]}>
					<AccordionItem value="getting-started">
						<AccordionTrigger>Getting Started</AccordionTrigger>
						<AccordionContent>
							<ol className="space-y-4">
								{GETTING_STARTED_STEPS.map(({ step, title, details }) => (
									<li key={step} className="flex gap-3">
										<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
											{step}
										</span>
										<div className="space-y-1">
											<div className="text-sm font-medium">{title}</div>
											<ul className="space-y-0.5">
												{details.map((detail) => (
													<li
														key={detail}
														className="text-xs text-muted-foreground"
													>
														{detail}
													</li>
												))}
											</ul>
										</div>
									</li>
								))}
							</ol>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="shortcuts" className="border-b-0">
						<AccordionTrigger>Keyboard Shortcuts</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-4">
								{KEYBOARD_SHORTCUTS.map((group) => (
									<ShortcutGroupSection key={group.title} group={group} />
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</DialogContent>
		</Dialog>
	);
}
