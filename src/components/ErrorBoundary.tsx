import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/50 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">System Malfunction</h2>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">An unexpected error has occurred in the system.</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-red-500/20 text-left">
              <p className="text-xs font-mono text-red-400 break-all">
                {error?.message || 'Unknown Error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
