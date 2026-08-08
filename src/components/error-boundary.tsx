import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("VeriMarket crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-6">
          <div className="w-full max-w-lg rounded-sm border border-fail/40 bg-fail/10 p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-fail">Something went wrong</p>
            <h1 className="mt-2 font-display text-xl font-bold text-ink">VeriMarket failed to load</h1>
            <p className="mt-3 whitespace-pre-wrap break-words font-mono text-xs text-muted">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-sm border border-line px-4 py-2 font-mono text-sm text-ink hover:border-accent hover:text-accent"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
