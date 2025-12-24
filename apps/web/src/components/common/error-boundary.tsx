import { Component, type ErrorInfo, type ReactNode } from "react";
import { StatusPage } from "@/components/common/status-page";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <StatusPage code="500" message="Something went wrong">
          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="max-h-48 max-w-2xl overflow-auto rounded-md bg-muted/50 p-4 text-muted-foreground text-xs">
              {this.state.error.stack}
            </pre>
          )}
        </StatusPage>
      );
    }

    return this.props.children;
  }
}
