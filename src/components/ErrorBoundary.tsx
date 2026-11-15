import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  resetSettings = () => {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("gridfinity"))
      .forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div role="alert">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The calculator hit an error, usually from settings saved by an older
            version. Resetting clears the drawer, printer, and bin names saved on
            this device.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={this.resetSettings}>
            Reset saved settings
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
