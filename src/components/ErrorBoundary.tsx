import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-background dark:bg-zinc-950 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full border border-border/50 bg-card/60 backdrop-blur-md rounded-2xl shadow-2xl p-6 text-center space-y-6">
            <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground">Algo no salió como esperábamos</h2>
              <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
                {this.state.error?.message || "Ocurrió un error inesperado al procesar la información en esta pantalla."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold border border-border hover:bg-muted/15 transition-all text-foreground"
              >
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
