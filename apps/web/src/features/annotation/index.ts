/**
 * Annotation Feature - Public API
 *
 * Draw, edit, and organize annotations on images.
 *
 * ## Import Guidelines (Code Splitting)
 *
 * このfeatureは2つのエントリーポイントを提供:
 *
 * ### `@/features/annotation` (このファイル)
 * - Konva非依存の軽量API
 * - WelcomeViewなど初期ロード時に使用可能
 *
 * ### `@/features/annotation/canvas`
 * - Konva依存のCanvas API
 * - EditorView内でのみ使用（遅延ロード対象）
 */

// ============================================
// Components
// ============================================

export { HelpButton } from "./components/help-button";
export { ImageUploader } from "./components/image-uploader";
export { LayerPanel } from "./components/panels/layer-panel";
export { LayerSheet } from "./components/panels/layer-sheet";
export {
  type ComponentEditorProps,
  PropertiesPanel,
} from "./components/panels/properties-panel";
export { PropertiesSheet } from "./components/panels/properties-sheet";
export { BottomToolbar } from "./components/toolbar/bottom-toolbar";
export { EditorHeader } from "./components/toolbar/editor-header";

// ============================================
// Store
// ============================================

export {
  selectElements,
  selectProject,
  selectSelectedIds,
  useAnnotationStore,
} from "./store";

// ============================================
// Contexts
// ============================================

export { IconResolverProvider } from "./contexts/icon-resolver-context";
