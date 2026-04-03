"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    IconFile,
    IconFolder,
    IconShieldCheck,
} from "@tabler/icons-react";

/**
 * FileAnalysisView — Per-file vulnerability analysis view for project-level scans
 *
 * Shows a tree/list of project files with vulnerability counts and severity badges.
 * Clicking a file filters the vulnerability display to that file.
 */

const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const severityColors = {
    Critical: "bg-severity-critical/10 text-severity-critical",
    High: "bg-severity-high/10 text-severity-high",
    Medium: "bg-severity-medium/10 text-severity-medium",
    Low: "bg-severity-low/10 text-severity-low",
};

function FileRow({ fileName, vulnerabilities, isSelected, onSelect }) {
    const highestSeverity = useMemo(() => {
        if (vulnerabilities.length === 0) return null;
        return vulnerabilities.reduce((highest, vuln) => {
            const current = severityOrder[vuln.severity] ?? 99;
            const best = severityOrder[highest] ?? 99;
            return current < best ? vuln.severity : highest;
        }, vulnerabilities[0].severity);
    }, [vulnerabilities]);

    const severityCounts = useMemo(() => {
        const counts = {};
        vulnerabilities.forEach((vuln) => {
            counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
        });
        return counts;
    }, [vulnerabilities]);

    return (
        <button
            onClick={() => onSelect(fileName)}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-all duration-150",
                "hover:bg-muted/80",
                isSelected && "bg-muted border border-border shadow-sm"
            )}
        >
            <IconFile className="size-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-mono truncate">{fileName}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {Object.entries(severityCounts)
                    .sort(
                        ([a], [b]) =>
                            (severityOrder[a] ?? 99) - (severityOrder[b] ?? 99)
                    )
                    .map(([severity, count]) => (
                        <Badge
                            key={severity}
                            variant="secondary"
                            className={cn(
                                "text-[10px] px-1.5 py-0 h-5 font-medium",
                                severityColors[severity]
                            )}
                        >
                            {count}
                        </Badge>
                    ))}
            </div>
        </button>
    );
}

export function FileAnalysisView({
    vulnerabilities = [],
    onFileSelect,
    selectedFile,
    className,
}) {
    // Group vulnerabilities by file
    const fileGroups = useMemo(() => {
        const groups = {};
        vulnerabilities.forEach((vuln) => {
            const file = vuln.fileName || vuln.filePath || "Unknown File";
            if (!groups[file]) {
                groups[file] = [];
            }
            groups[file].push(vuln);
        });

        // Sort files: files with highest severity first, then by count
        return Object.entries(groups).sort(([, a], [, b]) => {
            const aMax = Math.min(
                ...a.map((v) => severityOrder[v.severity] ?? 99)
            );
            const bMax = Math.min(
                ...b.map((v) => severityOrder[v.severity] ?? 99)
            );
            if (aMax !== bMax) return aMax - bMax;
            return b.length - a.length;
        });
    }, [vulnerabilities]);

    // Summary stats
    const stats = useMemo(() => {
        const totalFiles = fileGroups.length;
        const totalVulns = vulnerabilities.length;
        return { totalFiles, totalVulns };
    }, [fileGroups, vulnerabilities]);

    if (vulnerabilities.length === 0) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-dashed p-8 flex flex-col items-center justify-center text-muted-foreground",
                    className
                )}
            >
                <IconShieldCheck className="size-10 mb-2 text-success/50" />
                <p className="text-sm font-medium">No vulnerabilities found</p>
                <p className="text-xs">All files passed security analysis</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-lg font-bold tabular-nums">
                        {stats.totalFiles}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Affected Files
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
                        {stats.totalVulns}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Total Issues
                    </p>
                </div>
            </div>

            {/* File list */}
            <div className="rounded-lg border">
                <div className="px-3 py-2 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                        <IconFolder className="size-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Project Files
                        </span>
                        {selectedFile && (
                            <button
                                onClick={() => onFileSelect?.(null)}
                                className="ml-auto text-[10px] text-primary hover:underline"
                            >
                                Show All
                            </button>
                        )}
                    </div>
                </div>
                <ScrollArea className="max-h-96">
                    <div className="p-1">
                        {fileGroups.map(([fileName, vulns]) => (
                            <FileRow
                                key={fileName}
                                fileName={fileName}
                                vulnerabilities={vulns}
                                isSelected={selectedFile === fileName}
                                onSelect={(f) =>
                                    onFileSelect?.(
                                        f === selectedFile ? null : f
                                    )
                                }
                            />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

export default FileAnalysisView;
