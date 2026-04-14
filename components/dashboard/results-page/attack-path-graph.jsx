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
 * AttackPathGraph — Grid-based attack path visualization
 *
 * Renders dataFlow nodes as connected cards in a responsive grid,
 * matching the design from images: Source / Intermediate / Sink cards
 * with file:line, description, and directional arrows.
 *
 * Accepts:
 *   dataFlow: Node[]  — flat array of nodes
 *   dataFlow: { nodes: Node[], edges: Edge[] }  — object with nodes + edges
 */

const NODE_COLORS = {
    source: {
        bg: "bg-primary/8",
        border: "border-primary/30",
        badge: "bg-primary/15 text-primary border border-primary/30",
        connector: "bg-primary/30",
        header: "text-primary",
    },
    intermediate: {
        bg: "bg-amber-500/8",
        border: "border-amber-500/30",
        badge: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        connector: "bg-amber-500/30",
        header: "text-amber-500",
    },
    sink: {
        bg: "bg-destructive/8",
        border: "border-destructive/30",
        badge: "bg-destructive/15 text-destructive border border-destructive/30",
        connector: "bg-destructive/30",
        header: "text-destructive",
    },
};

const NODE_LABELS = {
    source: "Source",
    intermediate: "Intermediate",
    sink: "Sink",
};

function FlowNodeCard({ node }) {
    const colors = NODE_COLORS[node.type] || NODE_COLORS.intermediate;
    const typeLabel = NODE_LABELS[node.type] || node.type;
    const displayName = node.function || node.name || node.label || "unknown";
    const fileLine = node.file
        ? `${node.file}${node.line ? `:L${node.line}` : ""}`
        : node.line
        ? `L${node.line}`
        : null;

    return (
        <div
            className={cn(
                "flex flex-col rounded-lg border p-3.5 min-w-0 flex-1 transition-all duration-200 hover:shadow-sm",
                colors.bg,
                colors.border
            )}
        >
            {/* Header row: name + type badge */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className={cn("text-sm font-mono font-semibold truncate flex-1 cursor-default", colors.header)}>
                                {displayName}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px]">
                            <p className="font-mono text-xs break-all">{displayName}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0", colors.badge)}>
                    {typeLabel}
                </span>
            </div>

            {/* File:line */}
            {fileLine && (
                <p className="text-[11px] text-muted-foreground font-mono mb-1.5 flex items-center gap-1">
                    <span className="opacity-50">◎</span>
                    {fileLine}
                </p>
            )}

            {/* Description */}
            {node.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {node.description}
                </p>
            )}
        </div>
    );
}

function ArrowConnector({ vertical = false }) {
    if (vertical) {
        return (
            <div className="flex flex-col items-center py-1 flex-shrink-0">
                <div className="w-0.5 h-4 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20" />
                <svg width="10" height="6" viewBox="0 0 10 6" className="text-muted-foreground/50">
                    <path d="M0 0L5 5L10 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    }
    return (
        <div className="flex items-center flex-shrink-0 px-1">
            <div className="w-5 h-0.5 bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20" />
            <svg width="6" height="10" viewBox="0 0 6 10" className="text-muted-foreground/50 -ml-px">
                <path d="M0 0L5 5L0 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

export function AttackPathGraph({ dataFlow, className }) {
    const nodes = useMemo(() => {
        if (!dataFlow) return null;
        // Accept flat array or { nodes: [...], edges: [...] } object
        const arr = Array.isArray(dataFlow) ? dataFlow : (dataFlow.nodes || null);
        if (!arr || arr.length === 0) return null;
        // Normalise: support node.label, node.function, node.name interchangeably
        return arr.map(n => ({
            ...n,
            function: n.function || n.name || n.label || "unknown",
        }));
    }, [dataFlow]);

    if (!nodes) {
        return (
            <div className={cn("rounded-lg border border-dashed p-8 flex items-center justify-center text-sm text-muted-foreground", className)}>
                <div className="text-center space-y-1.5">
                    <p className="font-medium">No data flow available</p>
                    <p className="text-xs text-muted-foreground/70">
                        Data flow analysis was not generated for this vulnerability
                    </p>
                </div>
            </div>
        );
    }

    // Responsive grid layout: up to 4 cards per row with arrows between them
    // Group into rows of up to 4
    const COLS = Math.min(nodes.length, 4);
    const rows = [];
    for (let i = 0; i < nodes.length; i += COLS) {
        rows.push(nodes.slice(i, i + COLS));
    }

    return (
        <div className={cn("space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4", className)}>
            {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-stretch gap-0">
                    {row.map((node, colIdx) => {
                        const isLastInRow = colIdx === row.length - 1;
                        const globalIdx = rowIdx * COLS + colIdx;
                        const isLastGlobal = globalIdx === nodes.length - 1;
                        return (
                            <React.Fragment key={node.id || colIdx}>
                                <FlowNodeCard node={node} />
                                {!isLastInRow && !isLastGlobal && <ArrowConnector />}
                            </React.Fragment>
                        );
                    })}
                    {/* Pad incomplete last row */}
                    {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, i) => (
                        <div key={`pad-${i}`} className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default AttackPathGraph;
