import { useResponsiveLayout } from "../../hooks/use-responsive-layout";
import { DesktopEditorView } from "./editor-view-desktop";
import { MobileEditorView } from "./editor-view-mobile";

// Default export for React.lazy compatibility
export default function EditorView() {
	const { isMobile } = useResponsiveLayout();

	if (isMobile) {
		return <MobileEditorView />;
	}

	return <DesktopEditorView />;
}
