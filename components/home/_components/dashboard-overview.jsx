"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
    Shield,
    ShieldAlert,
    ShieldCheck,
    ArrowRight,
    Clock,
    Code,
    FileText,
    Settings2,
    BookOpen,
    Zap,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Activity,
    Trash2,
    GitBranch,
} from "lucide-react"

/**
 * WelcomeBanner — personalized greeting + quick-start actions.
 */
export function WelcomeBanner({ userName, onNavigate, onNewScan }) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
    const firstName = userName?.split(" ")[0] || userName

    const quickActions = [
        { label: "Code input", icon: Code, page: "Code input" },
        { label: "Configure workflow", icon: Settings2, page: "Workflow configuration" },
        { label: "Knowledge base", icon: BookOpen, page: "Knowledge base" },
        { label: "Write article", icon: FileText, page: "Write article" },
    ]

    return (
        <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                            {greeting}{firstName ? `, ${firstName}` : ""} 👋
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Here&apos;s what&apos;s happening with your security scans.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="w-fit"
                        onClick={onNewScan}
                    >
                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                        New scan
                    </Button>
                </div>

                {/* Quick action buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={action.page}
                                onClick={() => onNavigate({ title: action.page })}
                                className="group flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-center"
                            >
                                <div className="w-8 h-8 rounded-md bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium truncate w-full">{action.label}</span>
                            </button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * SecurityStatsCards — summary metrics from recent scans.
 */
export function SecurityStatsCards({ stats, isLoading }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-3 sm:p-4">
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-7 w-12 mb-1" />
                            <Skeleton className="h-2.5 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const cards = [
        {
            label: "Total scans",
            value: stats.totalScans,
            icon: Activity,
            description: stats.totalScans === 1 ? "workflow run" : "workflow runs",
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            label: "Findings",
            value: stats.totalVulnerabilities,
            icon: ShieldAlert,
            description: `${stats.openVulnerabilities} open`,
            color: stats.totalVulnerabilities > 0 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground",
            bg: stats.totalVulnerabilities > 0 ? "bg-orange-500/10" : "bg-muted",
        },
        {
            label: "Resolved",
            value: stats.resolvedVulnerabilities,
            icon: ShieldCheck,
            description: stats.totalVulnerabilities > 0
                ? `${Math.round((stats.resolvedVulnerabilities / stats.totalVulnerabilities) * 100)}% resolution rate`
                : "No findings yet",
            color: stats.resolvedVulnerabilities > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            bg: stats.resolvedVulnerabilities > 0 ? "bg-emerald-500/10" : "bg-muted",
        },
        {
            label: "Critical",
            value: stats.criticalCount,
            icon: AlertTriangle,
            description: stats.criticalCount > 0 ? "need immediate attention" : "none detected",
            color: stats.criticalCount > 0 ? "text-destructive" : "text-muted-foreground",
            bg: stats.criticalCount > 0 ? "bg-destructive/10" : "bg-muted",
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {cards.map((card) => {
                const Icon = card.icon
                return (
                    <Card key={card.label}>
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {card.label}
                                </span>
                                <div className={`w-7 h-7 rounded-md ${card.bg} flex items-center justify-center`}>
                                    <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                                </div>
                            </div>
                            <div className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                                {card.value}
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

/**
 * Max scans a user can keep. When exceeded, user must delete one or overwrite the oldest.
 */
export const MAX_SCANS = 3

/**
 * RecentScansCard — table-style list of recent workflow runs with severity breakdown.
 */
export function RecentScansCard({ runs, isLoading, onNavigate, onRefresh }) {
    const [deletingId, setDeletingId] = useState(null)

    const handleDeleteRun = async (runId, e) => {
        e?.stopPropagation()
        setDeletingId(runId)
        try {
            const res = await fetch("/api/workflow/runs", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ runId }),
            })
            if (!res.ok) throw new Error("Failed to delete scan")
            toast.success("Scan deleted")
            onRefresh?.()
        } catch (err) {
            toast.error(err.message || "Failed to delete scan")
        } finally {
            setDeletingId(null)
        }
    }


    if (isLoading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                    <CardTitle className="text-xs sm:text-sm md:text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent scans
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3">
                    <div className="space-y-2.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <div className="flex-1">
                                    <Skeleton className="h-3 w-24 mb-1.5" />
                                    <Skeleton className="h-2.5 w-16" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const statusConfig = {
        completed: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500", label: "Done" },
        running: { icon: Activity, color: "text-primary", dotColor: "bg-primary", label: "Running" },
        failed: { icon: XCircle, color: "text-destructive", dotColor: "bg-destructive", label: "Failed" },
        pending: { icon: Clock, color: "text-muted-foreground", dotColor: "bg-muted-foreground", label: "Pending" },
    }

    return (
        <>
        <Card className="flex flex-col min-h-0">
            <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm md:text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent scans
                    </CardTitle>
                    {runs.length > 0 && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                            {runs.length}/{MAX_SCANS}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 flex-1 min-h-0">
                {runs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium">No scans yet</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Start a new scan from the greeting area above
                        </p>
                    </div>
                ) : (
                    <div className="overflow-auto">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] text-muted-foreground font-medium border-b border-border/50 sticky top-0 bg-card z-10">
                            <span>Scan</span>
                            <span className="hidden sm:block w-[70px]">Source</span>
                            <span className="w-[60px] sm:w-[70px]">Status</span>
                            <span className="w-[110px] sm:w-[140px]">Vulnerabilities</span>
                            <span className="w-[60px] text-right">Created</span>
                        </div>
                        {/* Table rows */}
                        <ScrollArea className="h-[260px] sm:h-[300px]">
                            <div>
                                {runs.map((run) => {
                                    const config = statusConfig[run.status] || statusConfig.pending
                                    const timeAgo = getTimeAgo(run.startedAt)
                                    const projectName = run.metadata?.projectName || run.metadata?.code?.projectName || `Scan ${run.id.slice(-6)}`
                                    const branch = run.metadata?.branch || "master"
                                    const sc = run.severityCounts || { Critical: 0, High: 0, Medium: 0, Low: 0 }
                                    const totalVulns = sc.Critical + sc.High + sc.Medium + sc.Low
                                    const isDeleting = deletingId === run.id

                                    return (
                                        <button
                                            key={run.id}
                                            disabled={isDeleting}
                                            onClick={() => {
                                                if (typeof window !== "undefined") {
                                                    localStorage.setItem("vulniq_current_run_id", run.id)
                                                }
                                                onNavigate({ title: "Results" })
                                            }}
                                            className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 items-center px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/30 last:border-b-0 hover:bg-accent/50 transition-colors text-left group disabled:opacity-50"
                                        >
                                            {/* Scan name + repo */}
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium truncate">{projectName}</p>
                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                                    <Code className="h-2.5 w-2.5 shrink-0 inline" />
                                                    {projectName}
                                                </p>
                                            </div>

                                            {/* Source / branch */}
                                            <div className="hidden sm:flex items-center gap-1 w-[70px]">
                                                <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="text-[10px] text-muted-foreground truncate">{branch}</span>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-1.5 w-[60px] sm:w-[70px]">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${config.dotColor}`} />
                                                <span className={`text-[10px] sm:text-[11px] font-medium ${config.color}`}>{config.label}</span>
                                            </div>

                                            {/* Vulnerability severity badges */}
                                            <div className="flex items-center gap-0.5 w-[110px] sm:w-[140px]">
                                                {totalVulns === 0 ? (
                                                    <span className="text-[10px] text-muted-foreground">—</span>
                                                ) : (
                                                    <>
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-bold bg-severity-critical/15 text-severity-critical tabular-nums">
                                                            {sc.Critical}
                                                        </span>
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-bold bg-severity-high/15 text-severity-high tabular-nums">
                                                            {sc.High}
                                                        </span>
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-bold bg-severity-medium/15 text-severity-medium tabular-nums">
                                                            {sc.Medium}
                                                        </span>
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-bold bg-severity-low/15 text-severity-low tabular-nums">
                                                            {sc.Low}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Created + delete */}
                                            <div className="flex items-center gap-1 w-[60px] justify-end">
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                                                <TooltipProvider delayDuration={300}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                className="p-0.5 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                                onClick={(e) => handleDeleteRun(run.id, e)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteRun(run.id, e) }}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="text-xs">Delete scan</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
        </>
    )
}

/**
 * TopVulnerabilitiesCard — quick view of most critical open findings.
 */
export function TopVulnerabilitiesCard({ vulnerabilities, isLoading, onNavigate }) {
    const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    const severityVariant = {
        Critical: "destructive",
        High: "default",
        Medium: "secondary",
        Low: "outline",
    }

    const topVulns = [...(vulnerabilities || [])]
        .filter((v) => !v.resolved)
        .sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))
        .slice(0, 5)

    if (isLoading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4">
                    <CardTitle className="text-xs sm:text-sm md:text-base flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Top findings
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3">
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-5 w-14 rounded-full" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm md:text-base flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Top findings
                    </CardTitle>
                    {topVulns.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => onNavigate({ title: "Results" })}
                        >
                            View all
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3">
                {topVulns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <ShieldCheck className="h-8 w-8 text-emerald-600/60 dark:text-emerald-400/60 mb-1.5" />
                        <p className="text-xs font-medium">All clear</p>
                        <p className="text-[10px] text-muted-foreground">No open vulnerabilities</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {topVulns.map((vuln) => (
                            <div
                                key={vuln.id}
                                className="flex items-start gap-2 p-1.5 rounded-md hover:bg-accent transition-colors"
                            >
                                <Badge
                                    variant={severityVariant[vuln.severity] || "outline"}
                                    className="text-[9px] px-1.5 py-0 shrink-0 mt-0.5"
                                >
                                    {vuln.severity}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{vuln.title}</p>
                                    {vuln.fileName && (
                                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                                            {vuln.fileName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/**
 * Hook to fetch dashboard overview data.
 */
export function useDashboardOverview() {
    const { data: session } = useSession()
    const [data, setData] = useState({
        stats: {
            totalScans: 0,
            totalVulnerabilities: 0,
            openVulnerabilities: 0,
            resolvedVulnerabilities: 0,
            criticalCount: 0,
        },
        recentRuns: [],
        topVulnerabilities: [],
    })
    const [isLoading, setIsLoading] = useState(true)

    const fetchOverview = useCallback(async () => {
        if (!session?.user?.id) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)

            // Fetch recent runs
            const runsRes = await fetch("/api/workflow/runs?limit=8")
            const runsData = runsRes.ok ? await runsRes.json() : { runs: [] }

            // Fetch analytics summary
            const analyticsRes = await fetch("/api/analytics?dateRange=30d")
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : {}

            const vulnerabilities = analyticsData.vulnerabilities || []
            const openVulns = vulnerabilities.filter((v) => !v.resolved)
            const resolvedVulns = vulnerabilities.filter((v) => v.resolved)
            const criticals = openVulns.filter((v) => v.severity === "Critical")

            setData({
                stats: {
                    totalScans: analyticsData.scansCount ?? (runsData.runs?.length || 0),
                    totalVulnerabilities: vulnerabilities.length,
                    openVulnerabilities: openVulns.length,
                    resolvedVulnerabilities: resolvedVulns.length,
                    criticalCount: criticals.length,
                },
                recentRuns: runsData.runs || [],
                topVulnerabilities: openVulns,
            })
        } catch (err) {
            console.error("[DashboardOverview] Error fetching data:", err)
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.id])

    useEffect(() => {
        fetchOverview()
    }, [fetchOverview])

    return { ...data, isLoading, refresh: fetchOverview }
}

// ── Utility ─────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr) {
    if (!dateStr) return ""
    const now = new Date()
    const date = new Date(dateStr)
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
