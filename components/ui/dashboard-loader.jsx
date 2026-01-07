"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading screen with skeleton animation
 * Shows a shadcn-style skeleton overlay while the app initializes
 * Children are always rendered to preserve context providers
 */
export function DashboardLoader({ children, minLoadTime = 2000 }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, minLoadTime);

        return () => clearTimeout(timer);
    }, [minLoadTime]);

    return (
        <>
            {/* Always render children to preserve context */}
            <div className={isLoading ? "opacity-0 pointer-events-none" : "animate-in fade-in duration-300"}>
                {children}
            </div>
            
            {/* Skeleton overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex h-screen w-full bg-background">
                    {/* Sidebar skeleton */}
                    <div className="hidden md:flex w-64 flex-col border-r border-border/40 p-4 gap-4">
                        {/* Logo area */}
                        <div className="flex items-center gap-3 px-2 py-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        
                        {/* Nav items */}
                        <div className="flex flex-col gap-2 mt-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Bottom section */}
                        <div className="mt-auto flex flex-col gap-2">
                            <Skeleton className="h-px w-full" />
                            <div className="flex items-center gap-3 px-3 py-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex flex-col gap-1 flex-1">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-2 w-28" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header skeleton */}
                        <div className="flex h-14 items-center gap-4 border-b border-border/40 px-4">
                            <Skeleton className="h-8 w-8 md:hidden" />
                            <Skeleton className="h-4 w-32 hidden sm:block" />
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>

                        {/* Content skeleton */}
                        <div className="flex-1 p-4 md:p-6 overflow-hidden">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Title area */}
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-72" />
                                </div>

                                {/* Card skeleton */}
                                <div className="rounded-lg border border-border/40 p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-3 w-56" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-px w-full" />
                                    <div className="space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                </div>

                                {/* Grid skeleton */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="rounded-lg border border-border/40 p-4 space-y-3">
                                            <Skeleton className="h-24 w-full rounded-md" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DashboardLoader;
