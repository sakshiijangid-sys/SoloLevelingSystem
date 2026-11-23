import { captureException } from '@sentry/react';
import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  feature?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      captureException(error, { tags: { feature: this.props.feature ?? 'application' } });
    }
    console.error(`Error in ${this.props.feature ?? 'application'}`, error, errorInfo);
  }

  public render() {
    const { hasError } = this.state;
    const { children, feature } = this.props;

    if (hasError) {
      return (
        <div className={`bg-black flex items-center justify-center p-6 ${feature ? '' : 'min-h-screen'}`}>
          <div className="max-w-md w-full bg-gray-900 border border-red-500/50 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">{feature ? `${feature} unavailable` : 'System Malfunction'}</h2>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">An unexpected error has occurred in the system.</p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
