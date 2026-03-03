"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                        <h3 className="text-xl font-bold text-white">Something went wrong</h3>
                        <p className="text-sm text-zinc-400">
                            An unexpected error occurred. Please try again or contact support if the issue persists.
                        </p>
                        {this.state.error && (
                            <p className="text-xs text-zinc-600 font-mono bg-zinc-900 rounded-lg p-3 mt-3 text-left break-all">
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
