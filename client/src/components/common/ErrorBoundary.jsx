import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }

  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
          <p className="text-neutral-400 text-sm mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-outline px-5 py-2.5 text-sm">Try Again</button>
            <Link to="/" className="btn-gold px-5 py-2.5 text-sm">Go Home</Link>
          </div>
        </div>
      </div>
    );
    return this.props.children;
  }
}
