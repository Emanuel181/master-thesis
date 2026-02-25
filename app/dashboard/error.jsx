'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({ error, reset }) {
    useEffect(() => {
        console.error('[Dashboard Error]', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
            <Card className="max-w-md w-full border-destructive/20">
                <CardContent className="flex flex-col items-center text-center space-y-6 p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>

                    <div className="space-y-1.5">
                        <h2 className="text-lg font-semibold">Something went wrong</h2>
                        <p className="text-sm text-muted-foreground">
                            An error occurred while loading the dashboard. This has been logged automatically.
                        </p>
                    </div>

                    {process.env.NODE_ENV === 'development' && error?.message && (
                        <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                            <p className="text-xs font-mono text-destructive break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={reset} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.href = '/'} className="gap-2">
                            <Home className="h-4 w-4" />
                            Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

