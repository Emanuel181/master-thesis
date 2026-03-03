"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    IconChevronDown,
    IconChevronRight,
    IconMessageCircle,
    IconShieldCheck,
    IconShieldX,
    IconAlertTriangle,
    IconLoader,
    IconQuote,
} from "@tabler/icons-react";

/**
 * DebatePanel — Multi-agent debate display component
 *
 * Shows debate rounds in a chat-like timeline with agent roles,
 * arguments, citations, and verdicts.
 */

const ROLE_CONFIG = {
    advocate: {
        label: "Advocate",
        description: "Argues the vulnerability is real and significant",
        bg: "bg-destructive/5",
        border: "border-destructive/20",
        badge: "bg-destructive/10 text-destructive",
        icon: IconShieldX,
    },
    skeptic: {
        label: "Skeptic",
        description: "Challenges the finding and proposes alternatives",
        bg: "bg-primary/5",
        border: "border-primary/20",
        badge: "bg-primary/10 text-primary",
        icon: IconAlertTriangle,
    },
    judge: {
        label: "Judge",
        description: "Evaluates arguments and produces final verdict",
        bg: "bg-agent-report/5",
        border: "border-agent-report/20",
        badge: "bg-agent-report/10 text-agent-report",
        icon: IconShieldCheck,
    },
};

const VERDICT_CONFIG = {
    confirmed: {
        label: "Confirmed",
        color: "bg-destructive/10 text-destructive border-destructive/30",
        icon: IconShieldX,
    },
    rejected: {
        label: "Rejected (False Positive)",
        color: "bg-success/10 text-success border-success/30",
        icon: IconShieldCheck,
    },
    "needs-review": {
        label: "Needs Manual Review",
        color: "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
        icon: IconAlertTriangle,
    },
};

function CitationItem({ citation, index }) {
    return (
        <div className="flex gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
            <IconQuote className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground line-clamp-3">
                    {citation.excerpt}
                </p>
                {citation.source && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        — {citation.source}
                    </p>
                )}
            </div>
        </div>
    );
}

function DebateRound({ round, isLast }) {
    const [showCitations, setShowCitations] = useState(false);
    const roleConfig = ROLE_CONFIG[round.agentRole] || ROLE_CONFIG.advocate;
    const RoleIcon = roleConfig.icon;
    const citations = round.citations || [];
    const verdictConfig = round.verdict
        ? VERDICT_CONFIG[round.verdict]
        : null;

    return (
        <div className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center w-8 flex-shrink-0">
                <div
                    className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 z-10",
                        roleConfig.bg,
                        roleConfig.border
                    )}
                >
                    <RoleIcon className="size-4" />
                </div>
                {!isLast && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-border/20 -mt-px" />
                )}
            </div>

            {/* Content */}
            <div
                className={cn(
                    "flex-1 rounded-lg border p-3 mb-3 transition-all duration-200",
                    roleConfig.bg,
                    roleConfig.border
                )}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <span
                        className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5",
                            roleConfig.badge
                        )}
                    >
                        {roleConfig.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        Round {round.round}
                    </span>
                    {round.modelId && (
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {round.modelId.split("/").pop()}
                        </span>
                    )}
                </div>

                {/* Argument */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {round.argument}
                </div>

                {/* Verdict (for judge rounds) */}
                {verdictConfig && (
                    <div className="mt-3 flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn("text-xs", verdictConfig.color)}
                        >
                            <verdictConfig.icon className="size-3 mr-1" />
                            {verdictConfig.label}
                        </Badge>
                        {round.confidence != null && (
                            <span className="text-xs text-muted-foreground">
                                {Math.round(round.confidence * 100)}% confidence
                            </span>
                        )}
                    </div>
                )}

                {/* Citations toggle */}
                {citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCitations(!showCitations)}
                        >
                            {showCitations ? (
                                <IconChevronDown className="size-3 mr-1" />
                            ) : (
                                <IconChevronRight className="size-3 mr-1" />
                            )}
                            {citations.length} citation{citations.length !== 1 ? "s" : ""}
                        </Button>

                        {showCitations && (
                            <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                {citations.map((citation, i) => (
                                    <CitationItem
                                        key={i}
                                        citation={citation}
                                        index={i}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Timestamp */}
                {round.createdAt && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                        {new Date(round.createdAt).toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    );
}

export function DebatePanel({ vulnerabilityId, debateLog, className }) {
    const [debateRounds, setDebateRounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch debate rounds from API if vulnerabilityId is provided and no inline data
    useEffect(() => {
        if (!vulnerabilityId) return;
        // Skip API call if inline debateLog already has rounds
        if (debateLog?.rounds && Array.isArray(debateLog.rounds) && debateLog.rounds.length > 0) return;

        const fetchDebateData = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/workflow/debate?vulnerabilityId=${vulnerabilityId}`
                );
                if (!res.ok) throw new Error("Failed to fetch debate data");
                const data = await res.json();
                if (data.success && data.data?.debates) {
                    const rounds =
                        data.data.debates[vulnerabilityId] ||
                        data.data.debates["general"] ||
                        [];
                    setDebateRounds(rounds);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDebateData();
    }, [vulnerabilityId, debateLog]);

    // Use inline debateLog if available (from vulnerability object)
    const rounds = useMemo(() => {
        if (debateRounds.length > 0) return debateRounds;
        if (debateLog?.rounds && Array.isArray(debateLog.rounds))
            return debateLog.rounds;
        return [];
    }, [debateRounds, debateLog]);

    // Final verdict from debateLog or last judge round
    const finalVerdict = useMemo(() => {
        if (debateLog?.verdict) return debateLog;
        const judgeRound = [...rounds]
            .reverse()
            .find((r) => r.agentRole === "judge" && r.verdict);
        if (judgeRound)
            return {
                verdict: judgeRound.verdict,
                confidence: judgeRound.confidence,
            };
        return null;
    }, [rounds, debateLog]);

    if (loading) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center p-8",
                    className
                )}
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <IconLoader className="size-4 animate-spin" />
                    <span className="text-sm">Loading debate data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-dashed border-red-300 dark:border-red-800 p-6 text-center",
                    className
                )}
            >
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            </div>
        );
    }

    if (rounds.length === 0) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-dashed p-6 flex items-center justify-center text-sm text-muted-foreground",
                    className
                )}
            >
                <div className="text-center space-y-1">
                    <IconMessageCircle className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="font-medium">No debate data available</p>
                    <p className="text-xs">
                        Multi-agent debate was not conducted for this vulnerability
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Summary verdict */}
            {finalVerdict && (
                <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <IconShieldCheck className="size-5 text-agent-report" />
                        <span className="text-sm font-medium">
                            Debate Verdict:
                        </span>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs",
                            VERDICT_CONFIG[finalVerdict.verdict]?.color
                        )}
                    >
                        {VERDICT_CONFIG[finalVerdict.verdict]?.label ||
                            finalVerdict.verdict}
                    </Badge>
                    {finalVerdict.confidence != null && (
                        <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round(finalVerdict.confidence * 100)}%
                            confidence
                        </span>
                    )}
                </div>
            )}

            {/* Debate rounds */}
            <div>
                {rounds.map((round, i) => (
                    <DebateRound
                        key={round.id || i}
                        round={round}
                        isLast={i === rounds.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}

export default DebatePanel;
