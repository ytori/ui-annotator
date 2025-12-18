/**
 * Built-in Components Loader
 */

import {
	AlertCircle,
	ArrowLeftRight,
	Bell,
	BoxSelect,
	Calendar,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	Circle,
	CircleUser,
	Columns3,
	CreditCard,
	Grip,
	GripVertical,
	Heading,
	Image,
	LayoutGrid,
	LayoutList,
	LayoutTemplate,
	Link,
	List,
	ListFilter,
	Loader,
	Menu,
	MessageSquare,
	Minus,
	MoreHorizontal,
	MousePointerClick,
	PanelBottom,
	PanelLeft,
	PanelRight,
	PanelTop,
	Play,
	RectangleHorizontal,
	Rows3,
	ScrollText,
	SlidersHorizontal,
	Square,
	SquareDashed,
	Table,
	Tag,
	TextCursorInput,
	ToggleLeft,
	Type,
	Upload,
} from "lucide-react";
import type { UIComponentSuggestion } from "../types";
import type { ManifestLoader } from "./types";

/**
 * Built-in manifest marker
 */
export interface BuiltinManifest {
	type: "builtin";
	v: 1;
}

/**
 * Built-in component definitions
 */
const BUILTIN_COMPONENTS: UIComponentSuggestion[] = [
	// Forms
	{
		name: "Input",
		icon: TextCursorInput,
		category: "Forms",
		description: "Text input field",
	},
	{
		name: "Textarea",
		icon: Square,
		category: "Forms",
		description: "Multi-line text input",
	},
	{
		name: "Select",
		icon: ListFilter,
		category: "Forms",
		description: "Dropdown selection",
	},
	{
		name: "Checkbox",
		icon: CheckSquare,
		category: "Forms",
		description: "Checkbox input",
	},
	{
		name: "Radio",
		icon: Circle,
		category: "Forms",
		description: "Radio button input",
	},
	{
		name: "Switch",
		icon: ToggleLeft,
		category: "Forms",
		description: "Toggle switch",
	},
	{
		name: "Slider",
		icon: SlidersHorizontal,
		category: "Forms",
		description: "Range slider",
	},
	{
		name: "DatePicker",
		icon: Calendar,
		category: "Forms",
		description: "Date selection",
	},
	{
		name: "FileUpload",
		icon: Upload,
		category: "Forms",
		description: "File upload input",
	},

	// Actions
	{
		name: "Button",
		icon: RectangleHorizontal,
		category: "Actions",
		description: "Clickable button",
	},
	{
		name: "IconButton",
		icon: MousePointerClick,
		category: "Actions",
		description: "Icon-only button",
	},
	{
		name: "Link",
		icon: Link,
		category: "Actions",
		description: "Navigation link",
	},

	// Layout - Containers
	{
		name: "Stack",
		icon: LayoutList,
		category: "Layout",
		description: "Vertical stack layout",
	},
	{
		name: "HStack",
		icon: Columns3,
		category: "Layout",
		description: "Horizontal stack layout",
	},
	{
		name: "VStack",
		icon: LayoutList,
		category: "Layout",
		description: "Vertical stack layout",
	},
	{
		name: "Flex",
		icon: GripVertical,
		category: "Layout",
		description: "Flexbox container",
	},
	{
		name: "Grid",
		icon: LayoutGrid,
		category: "Layout",
		description: "Grid layout",
	},
	{
		name: "Container",
		icon: SquareDashed,
		category: "Layout",
		description: "Centered container",
	},
	{
		name: "Box",
		icon: Square,
		category: "Layout",
		description: "Generic container",
	},
	{
		name: "Section",
		icon: LayoutTemplate,
		category: "Layout",
		description: "Page section",
	},
	{
		name: "Header",
		icon: PanelTop,
		category: "Layout",
		description: "Page header",
	},
	{
		name: "Footer",
		icon: PanelBottom,
		category: "Layout",
		description: "Page footer",
	},
	{
		name: "Sidebar",
		icon: PanelLeft,
		category: "Layout",
		description: "Side navigation",
	},
	{
		name: "Main",
		icon: LayoutTemplate,
		category: "Layout",
		description: "Main content area",
	},

	// Layout - Components
	{
		name: "Card",
		icon: CreditCard,
		category: "Layout",
		description: "Content card",
	},
	{
		name: "Dialog",
		icon: PanelTop,
		category: "Layout",
		description: "Modal dialog",
	},
	{
		name: "Drawer",
		icon: PanelRight,
		category: "Layout",
		description: "Slide-out panel",
	},
	{
		name: "Tabs",
		icon: Rows3,
		category: "Layout",
		description: "Tabbed interface",
	},
	{
		name: "Accordion",
		icon: ChevronDown,
		category: "Layout",
		description: "Collapsible sections",
	},

	// Data Display
	{
		name: "Table",
		icon: Table,
		category: "Data Display",
		description: "Data table",
	},
	{
		name: "List",
		icon: List,
		category: "Data Display",
		description: "List of items",
	},
	{
		name: "Avatar",
		icon: CircleUser,
		category: "Data Display",
		description: "User avatar",
	},
	{
		name: "Badge",
		icon: Tag,
		category: "Data Display",
		description: "Status badge",
	},
	{
		name: "Tooltip",
		icon: MessageSquare,
		category: "Data Display",
		description: "Hover tooltip",
	},

	// Navigation
	{
		name: "Menu",
		icon: Menu,
		category: "Navigation",
		description: "Navigation menu",
	},
	{
		name: "Dropdown",
		icon: MoreHorizontal,
		category: "Navigation",
		description: "Dropdown menu",
	},
	{
		name: "Breadcrumb",
		icon: ChevronRight,
		category: "Navigation",
		description: "Breadcrumb navigation",
	},
	{
		name: "Pagination",
		icon: ArrowLeftRight,
		category: "Navigation",
		description: "Page navigation",
	},

	// Feedback
	{
		name: "Alert",
		icon: AlertCircle,
		category: "Feedback",
		description: "Alert message",
	},
	{
		name: "Toast",
		icon: Bell,
		category: "Feedback",
		description: "Toast notification",
	},
	{
		name: "Progress",
		icon: Loader,
		category: "Feedback",
		description: "Progress indicator",
	},
	{
		name: "Skeleton",
		icon: BoxSelect,
		category: "Feedback",
		description: "Loading skeleton",
	},

	// Typography
	{
		name: "Text",
		icon: Type,
		category: "Typography",
		description: "Text content",
	},
	{
		name: "Heading",
		icon: Heading,
		category: "Typography",
		description: "Heading text",
	},

	// Media
	{
		name: "Image",
		icon: Image,
		category: "Media",
		description: "Image element",
	},
	{
		name: "Video",
		icon: Play,
		category: "Media",
		description: "Video player",
	},

	// Other
	{
		name: "Divider",
		icon: Minus,
		category: "Other",
		description: "Visual separator",
	},
	{
		name: "ScrollArea",
		icon: ScrollText,
		category: "Other",
		description: "Scrollable container",
	},
	{
		name: "Separator",
		icon: Grip,
		category: "Other",
		description: "Section separator",
	},
];

function isBuiltinManifest(json: unknown): json is BuiltinManifest {
	if (typeof json !== "object" || json === null) return false;
	const obj = json as Record<string, unknown>;
	return obj.type === "builtin" && obj.v === 1;
}

/**
 * Built-in manifest loader
 */
export const builtinLoader: ManifestLoader = {
	id: "builtin",
	name: "Built-in",

	canHandle: isBuiltinManifest,

	parse: () => BUILTIN_COMPONENTS,
};

/**
 * Get the builtin manifest marker (for store initialization)
 */
const _BUILTIN_MANIFEST: BuiltinManifest = { type: "builtin", v: 1 };

/**
 * Get builtin components directly (for convenience)
 */
export function getBuiltinComponents(): UIComponentSuggestion[] {
	return BUILTIN_COMPONENTS;
}
