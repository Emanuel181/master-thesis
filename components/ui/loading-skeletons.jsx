"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

// Page-specific loading skeletons
function PromptCardSkeleton() {
    return (
        <div className="border border-border/50 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                <div className="flex-1 min-w-0">
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-2.5 w-full" />
                </div>
            </div>
        </div>
    )
}

function RepoCardSkeleton() {
    return (
        <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    )
}

function CategoryCardSkeleton() {
    return (
        <div className="border rounded-xl p-4 h-[200px] flex flex-col">
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4 mb-3" />
            <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20 rounded-md" />
            </div>
        </div>
    )
}

function FileTreeSkeleton() {
    const widths = [80, 100, 70, 120, 90, 60, 110, 85];
    const indents = [0, 12, 12, 24, 0, 12, 24, 12];
    return (
        <div className="space-y-1 p-2">
            {widths.map((width, i) => (
                <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${indents[i]}px` }}>
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4" style={{ width: `${width}px` }} />
                </div>
            ))}
        </div>
    )
}

function DocumentListSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border rounded-lg">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            ))}
        </div>
    )
}

function WorkflowNodeSkeleton() {
    return (
        <div className="border rounded-lg p-4 w-[300px]">
            <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    )
}

function ProfileFieldSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    )
}

function TableRowSkeleton({ columns = 4 }) {
    return (
        <div className="flex items-center gap-4 p-3 border-b">
            {[...Array(columns)].map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: i === 0 ? '200px' : '100px' }} />
            ))}
        </div>
    )
}

// Full page loading states
function HomePageSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
            {/* Left panel - Prompts */}
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-3">
                            <Skeleton className="h-5 w-24 mb-3" />
                            <div className="space-y-2">
                                <PromptCardSkeleton />
                                <PromptCardSkeleton />
                                <PromptCardSkeleton />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Right panel - Repos */}
            <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                    <RepoCardSkeleton />
                    <RepoCardSkeleton />
                    <RepoCardSkeleton />
                </div>
            </div>
        </div>
    )
}

function KnowledgeBasePageSkeleton() {
    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-7 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

function CodePageSkeleton() {
    const lineWidths = ['45%', '70%', '35%', '80%', '50%', '65%', '40%', '75%', '55%', '30%', '85%', '60%', '45%', '70%', '25%'];
    return (
        <div className="flex h-full">
            {/* File tree */}
            <div className="w-56 border-r p-2">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-6 rounded" />
                </div>
                <FileTreeSkeleton />
            </div>
            {/* Editor area */}
            <div className="flex-1 flex flex-col">
                {/* Tabs */}
                <div className="flex gap-1 p-1 border-b">
                    <Skeleton className="h-7 w-24 rounded-sm" />
                    <Skeleton className="h-7 w-28 rounded-sm" />
                </div>
                {/* Editor header */}
                <div className="flex items-center justify-between p-2 border-b">
                    <Skeleton className="h-8 w-32 rounded-md" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
                {/* Editor content */}
                <div className="flex-1 p-4">
                    <div className="space-y-2">
                        {lineWidths.map((width, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4" style={{ width }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export {
    Skeleton,
    PromptCardSkeleton,
    RepoCardSkeleton,
    CategoryCardSkeleton,
    FileTreeSkeleton,
    DocumentListSkeleton,
    WorkflowNodeSkeleton,
    ProfileFieldSkeleton,
    TableRowSkeleton,
    HomePageSkeleton,
    KnowledgeBasePageSkeleton,
    CodePageSkeleton,
}

