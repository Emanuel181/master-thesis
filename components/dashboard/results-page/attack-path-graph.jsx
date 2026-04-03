"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * AttackPathGraph — Interactive SVG-based attack path visualization
 *
 * Renders dataFlow nodes (source → intermediate → sink) as connected cards
 * with directional arrows and color-coded badges.
 */

const NODE_COLORS = {
    source: {
        bg: "bg-primary/5",
        border: "border-primary/30",
        badge: "bg-primary/10 text-primary",
        dot: "bg-primary",
    },
    intermediate: {
        bg: "bg-severity-medium/5",
        border: "border-severity-medium/30",
        badge: "bg-severity-medium/10 text-severity-medium",
        dot: "bg-severity-medium",
    },
    sink: {
        bg: "bg-destructive/5",
        border: "border-destructive/30",
        badge: "bg-destructive/10 text-destructive",
        dot: "bg-destructive",
    },
};

const NODE_LABELS = {
    source: "Source",
    intermediate: "Transform",
    sink: "Sink",
};

function FlowNode({ node, index, isLast }) {
    const colors = NODE_COLORS[node.type] || NODE_COLORS.intermediate;
    const label = NODE_LABELS[node.type] || node.type;

    return (
        <div className="flex items-center gap-0">
            {/* Node Card */}
            <div
                className={cn(
                    "relative flex flex-col gap-1 rounded-lg border p-3 min-w-[180px] max-w-[240px] transition-all duration-200 hover:scale-[1.02]",
                    colors.bg,
                    colors.border
                )}
            >
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    <span
                        className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5",
                            colors.badge
                        )}
                    >
                        {label}
                    </span>
                    {index !== undefined && (
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                            #{index + 1}
                        </span>
                    )}
                </div>

                {/* Function name */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="text-sm font-mono font-medium truncate cursor-default">
                                {node.function || node.name || "unknown"}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-mono text-xs">
                                {node.function || node.name}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* File & line */}
                {(node.file || node.line) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                        {node.file}
                        {node.line ? `:${node.line}` : ""}
                    </p>
                )}

                {/* Description */}
                {node.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {node.description}
                    </p>
                )}
            </div>

            {/* Arrow connector */}
            {!isLast && (
                <div className="flex items-center mx-1 flex-shrink-0">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20 relative">
                        {/* Animated pulse on the line */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 animate-pulse" />
                    </div>
                    <svg
                        width="8"
                        height="12"
                        viewBox="0 0 8 12"
                        className="text-muted-foreground/50 -ml-px"
                    >
                        <path
                            d="M1 1L6 6L1 11"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}

export function AttackPathGraph({ dataFlow, className }) {
    const nodes = useMemo(() => {
        if (!dataFlow || !Array.isArray(dataFlow) || dataFlow.length === 0) {
            return null;
        }
        return dataFlow;
    }, [dataFlow]);

    if (!nodes) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-dashed p-6 flex items-center justify-center text-sm text-muted-foreground",
                    className
                )}
            >
                <div className="text-center space-y-1">
                    <p className="font-medium">No data flow available</p>
                    <p className="text-xs">
                        Data flow analysis was not generated for this vulnerability
                    </p>
                </div>
            </div>
        );
    }

    // For compact flows (≤3 nodes), render inline
    if (nodes.length <= 3) {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Attack Path ({nodes.length} step{nodes.length > 1 ? "s" : ""})
                    </p>
                </div>
                <div className="flex items-center overflow-x-auto pb-2">
                    {nodes.map((node, i) => (
                        <FlowNode
                            key={i}
                            node={node}
                            index={i}
                            isLast={i === nodes.length - 1}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // For larger flows, render as vertical list with connections
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Attack Path ({nodes.length} steps)
                </p>
            </div>
            <div className="space-y-0">
                {nodes.map((node, i) => {
                    const colors =
                        NODE_COLORS[node.type] || NODE_COLORS.intermediate;
                    return (
                        <div key={i} className="flex gap-3">
                            {/* Vertical connector */}
                            <div className="flex flex-col items-center w-6 flex-shrink-0">
                                <div
                                    className={cn(
                                        "h-3 w-3 rounded-full border-2 z-10",
                                        colors.dot,
                                        "border-background"
                                    )}
                                />
                                {i < nodes.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/10 -mt-px" />
                                )}
                            </div>

                            {/* Node content */}
                            <div
                                className={cn(
                                    "flex-1 rounded-lg border p-3 mb-2 transition-all duration-200 hover:shadow-sm",
                                    colors.bg,
                                    colors.border
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={cn(
                                            "text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5",
                                            colors.badge
                                        )}
                                    >
                                        {NODE_LABELS[node.type] || node.type}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        Step {i + 1}
                                    </span>
                                </div>
                                <p className="text-sm font-mono font-medium">
                                    {node.function || node.name || "unknown"}
                                </p>
                                {(node.file || node.line) && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {node.file}
                                        {node.line ? `:${node.line}` : ""}
                                    </p>
                                )}
                                {node.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {node.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AttackPathGraph;
