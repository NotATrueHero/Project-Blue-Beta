import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("System Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', backgroundColor: '#0047FF', color: 'white', height: '100vh', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', textTransform: 'uppercase' }}>System Critical Error</h1>
          <p style={{ marginTop: 20, opacity: 0.8 }}>The application has encountered a fatal exception.</p>
          <div style={{ marginTop: 40, padding: 20, border: '2px solid white', background: 'rgba(0,0,0,0.2)' }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 20, padding: '10px 20px', border: '2px solid white', background: 'transparent', color: 'white', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Reboot System
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);