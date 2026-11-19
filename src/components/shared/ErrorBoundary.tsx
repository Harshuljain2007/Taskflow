import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/src/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected interface error occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[TaskFlow UI ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#171923] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-[12px] border border-[#E5E7EB] bg-white p-8">
            <h1 className="text-xl font-semibold tracking-tight text-[#171923]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              {this.state.errorMessage}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={this.handleReset}>Try Again</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
