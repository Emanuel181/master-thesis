'use client';

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, Check } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}) {
  const [copied, setCopied] = useState(false);
  const [errorId] = useState(() => 
    `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );

  useEffect(() => {
    // Log the error with context for debugging
    console.error('[GlobalError]', {
      errorId,
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error, errorId]);

  const handleCopyError = async () => {
    const errorInfo = `Error ID: ${errorId}\nMessage: ${error?.message || 'Unknown error'}\nTime: ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(errorInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <head>
        <title>Error | VulnIQ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white antialiased">
        <div className="flex flex-col items-center text-center space-y-6 p-6 max-w-md mx-auto">
          {/* Error Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
            <div className="relative p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-sm">
              We encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>
          </div>

          {/* Error ID */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs font-mono text-zinc-400">
            <span>Error ID: {errorId}</span>
            <button
              onClick={handleCopyError}
              className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
              title="Copy error details"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 border border-zinc-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go home
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-zinc-500">
            If this problem persists, please contact{' '}
            <a href="mailto:support@vulniq.org" className="text-zinc-400 hover:text-white underline underline-offset-2">
              support@vulniq.org
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
