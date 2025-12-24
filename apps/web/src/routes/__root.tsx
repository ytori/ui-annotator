import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import "../index.css";

export type RouterAppContext = Record<string, never>;

// NOTE: SEO/OGPメタタグはindex.htmlに直書き（SPAではJS実行前のHTMLがクローラーに読まれるため）
export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      storageKey="ui-annotator-theme"
    >
      <ErrorBoundary>
        <div className="h-svh" vaul-drawer-wrapper="">
          <Outlet />
        </div>
      </ErrorBoundary>
      <Toaster richColors />
    </ThemeProvider>
  );
}
