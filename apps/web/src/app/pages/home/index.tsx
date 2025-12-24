import { lazy, Suspense, useEffect } from "react";
import Loader from "@/components/common/loader";
import { selectProject, useAnnotationStore } from "@/features/annotation";
import { cancelIdle, requestIdle } from "@/lib/request-idle-agnostic";
import { WelcomeView } from "./welcome-view";

// EditorView を遅延読み込み
const editorViewImport = () => import("./editor-view");
const EditorView = lazy(editorViewImport);

/**
 * Preload EditorView during idle time
 */
function usePreloadEditorView() {
  useEffect(() => {
    const id = requestIdle(() => {
      editorViewImport();
    });
    return () => cancelIdle(id);
  }, []);
}

/**
 * Root page component that switches between WelcomeView and EditorView
 * based on project state.
 */
export function RootPage() {
  const project = useAnnotationStore(selectProject);

  usePreloadEditorView();

  if (!project) {
    return <WelcomeView />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <EditorView />
    </Suspense>
  );
}
