/**
 * Shared utilities for component loaders
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
	Component,
	CreditCard,
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
	type LucideIcon,
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
import type { UIComponentCategory } from "../types";

/**
 * Category inference patterns
 */
const CATEGORY_PATTERNS: { pattern: RegExp; category: UIComponentCategory }[] =
	[
		{ pattern: /input|field|form|textarea|select/i, category: "Forms" },
		{ pattern: /datepicker|date-picker|calendar/i, category: "Forms" },
		{ pattern: /checkbox|radio|switch|toggle/i, category: "Forms" },
		{ pattern: /button|btn|ボタン/i, category: "Actions" },
		{ pattern: /link|anchor|リンク/i, category: "Actions" },
		{ pattern: /layout|container|grid|flex/i, category: "Layout" },
		{ pattern: /card|panel|box|section/i, category: "Layout" },
		{ pattern: /modal|dialog|drawer/i, category: "Layout" },
		{ pattern: /tab|accordion|collapse|アコーディオン/i, category: "Layout" },
		{ pattern: /table|list|テーブル/i, category: "Data Display" },
		{ pattern: /avatar|badge|tag|chip/i, category: "Data Display" },
		{ pattern: /tooltip|popover/i, category: "Data Display" },
		{ pattern: /nav|menu|breadcrumb|パンくず/i, category: "Navigation" },
		{ pattern: /pagination|ページネーション/i, category: "Navigation" },
		{ pattern: /alert|notification|toast|通知/i, category: "Feedback" },
		{ pattern: /loading|spinner|progress|skeleton/i, category: "Feedback" },
		{
			pattern: /text|heading|title|typography|見出し/i,
			category: "Typography",
		},
		{ pattern: /image|img|video|media|icon/i, category: "Media" },
	];

/**
 * Icon inference patterns (maps component names to icons)
 */
const ICON_PATTERNS: { pattern: RegExp; icon: LucideIcon }[] = [
	// Forms
	{ pattern: /^input$|入力/i, icon: TextCursorInput },
	{ pattern: /textarea|テキストエリア/i, icon: Square },
	{ pattern: /select|dropdown|セレクト/i, icon: ListFilter },
	{ pattern: /checkbox|チェックボックス/i, icon: CheckSquare },
	{ pattern: /radio|ラジオ/i, icon: Circle },
	{ pattern: /switch|toggle|スイッチ/i, icon: ToggleLeft },
	{ pattern: /slider|range|スライダー/i, icon: SlidersHorizontal },
	{ pattern: /datepicker|date-picker|calendar|日付/i, icon: Calendar },
	{ pattern: /upload|file|アップロード/i, icon: Upload },
	// Actions
	{ pattern: /button|btn|ボタン/i, icon: RectangleHorizontal },
	{ pattern: /iconbutton|icon-button/i, icon: MousePointerClick },
	{ pattern: /^link$|リンク/i, icon: Link },
	// Layout
	{ pattern: /stack|vstack/i, icon: LayoutList },
	{ pattern: /hstack/i, icon: Columns3 },
	{ pattern: /flex/i, icon: GripVertical },
	{ pattern: /grid|グリッド/i, icon: LayoutGrid },
	{ pattern: /container|コンテナ/i, icon: SquareDashed },
	{ pattern: /^box$/i, icon: Square },
	{ pattern: /section|セクション/i, icon: LayoutTemplate },
	{ pattern: /header|ヘッダー/i, icon: PanelTop },
	{ pattern: /footer|フッター/i, icon: PanelBottom },
	{ pattern: /sidebar|サイドバー/i, icon: PanelLeft },
	{ pattern: /^main$/i, icon: LayoutTemplate },
	{ pattern: /card|カード/i, icon: CreditCard },
	{ pattern: /dialog|modal|ダイアログ|モーダル/i, icon: PanelTop },
	{ pattern: /drawer|ドロワー/i, icon: PanelRight },
	{ pattern: /tabs?$|タブ/i, icon: Rows3 },
	{ pattern: /accordion|collapse|アコーディオン/i, icon: ChevronDown },
	// Data Display
	{ pattern: /table|テーブル/i, icon: Table },
	{ pattern: /^list$|リスト/i, icon: List },
	{ pattern: /avatar|アバター/i, icon: CircleUser },
	{ pattern: /badge|tag|chip|バッジ|タグ/i, icon: Tag },
	{ pattern: /tooltip|popover|ツールチップ/i, icon: MessageSquare },
	// Navigation
	{ pattern: /menu|メニュー/i, icon: Menu },
	{ pattern: /dropdown/i, icon: MoreHorizontal },
	{ pattern: /breadcrumb|パンくず/i, icon: ChevronRight },
	{ pattern: /pagination|ページネーション/i, icon: ArrowLeftRight },
	// Feedback
	{ pattern: /alert|notification|アラート|通知/i, icon: AlertCircle },
	{ pattern: /toast|トースト/i, icon: Bell },
	{ pattern: /progress|loading|spinner|プログレス/i, icon: Loader },
	{ pattern: /skeleton|スケルトン/i, icon: BoxSelect },
	// Typography
	{ pattern: /^text$|paragraph|テキスト/i, icon: Type },
	{ pattern: /heading|title|見出し/i, icon: Heading },
	// Media
	{ pattern: /image|img|画像/i, icon: Image },
	{ pattern: /video|動画/i, icon: Play },
	// Other
	{ pattern: /divider|separator|区切り/i, icon: Minus },
	{ pattern: /scroll|スクロール/i, icon: ScrollText },
];

/**
 * Infer category from component id and name
 */
export function inferCategory(id: string, name: string): UIComponentCategory {
	const searchText = `${id} ${name}`;
	for (const { pattern, category } of CATEGORY_PATTERNS) {
		if (pattern.test(searchText)) return category;
	}
	return "Other";
}

/**
 * Infer icon from component name
 */
export function inferIcon(name: string): LucideIcon {
	for (const { pattern, icon } of ICON_PATTERNS) {
		if (pattern.test(name)) return icon;
	}
	return Component;
}
