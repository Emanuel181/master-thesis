"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents entire app crashes when a component fails
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({ errorInfo });

        // In production, you would send this to an error tracking service
        // e.g., Sentry, LogRocket, etc.
        if (process.env.NODE_ENV === 'production') {
            // sendToErrorTracking(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        // Call optional onReset callback
        this.props.onReset?.();
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    resetError: this.handleReset,
                });
            }

            // Default fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 bg-background border border-border rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-4">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-lg font-semibold">
                            {this.props.title || "Something went wrong"}
                        </h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                        {this.props.message || "An unexpected error occurred. Please try again or refresh the page."}
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mb-4 p-3 bg-muted rounded-md text-xs max-w-full overflow-auto">
                            <summary className="cursor-pointer font-medium mb-2">
                                Error Details (Development Only)
                            </summary>
                            <pre className="whitespace-pre-wrap break-words">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={this.handleReset}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>

                        {this.props.showReload !== false && (
                            <Button
                                variant="default"
                                onClick={this.handleReload}
                            >
                                Reload Page
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap a component with error boundary
 * @param {React.ComponentType} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.ComponentType} Wrapped component
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
    const WrappedComponent = (props) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}

/**
 * Hook to programmatically trigger error boundary
 * Useful for handling async errors in event handlers
 */
export function useErrorBoundary() {
    const [error, setError] = React.useState(null);

    if (error) {
        throw error;
    }

    const triggerError = React.useCallback((err) => {
        setError(err);
    }, []);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    return { triggerError, resetError };
}

/**
 * Page-level error boundary with customized messaging
 * Use this to wrap entire page content sections
 */
export function PageErrorBoundary({ children, pageName = 'page' }) {
    return (
        <ErrorBoundary
            title={`Error loading ${pageName}`}
            message={`There was a problem loading this ${pageName.toLowerCase()}. Please try again.`}
        >
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;

