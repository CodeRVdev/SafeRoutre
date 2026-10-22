import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafeRoute Web Admin Caught Unhandled Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-rose-500/40 text-center space-y-5 shadow-2xl shadow-rose-950/40">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">System Encountered an Error</h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                A component failed to render properly. Instead of a blank screen, you can reload the dashboard to recover.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3 text-left">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Error Details:
                </span>
                <p className="font-mono text-xs text-rose-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload SafeRoute Portal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
