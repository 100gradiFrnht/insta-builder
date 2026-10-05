import { Component } from 'react';

// Keeps a crash inside a modal from unmounting the whole editor (which leaves a blank page and loses work)
export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Preview crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
                <div className="bg-gray-800 text-gray-200 rounded-lg p-5 max-w-md space-y-3">
                    <h2 className="font-semibold">Something went wrong in the preview</h2>
                    <p className="text-sm text-gray-300">{String(this.state.error.message || this.state.error)}</p>
                    <p className="text-xs text-gray-400">Your slides are safe. If you had just sent posts, check Buffer before sending again.</p>
                    <button onClick={this.props.onClose} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm">Close</button>
                </div>
            </div>
        );
    }
}
