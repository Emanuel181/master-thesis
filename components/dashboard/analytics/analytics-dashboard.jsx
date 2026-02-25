"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Shield,
    TrendingUp,
    TrendingDown,
    Calendar,
    GitBranch,
    Activity,
    Download,
    RefreshCw,
} from "lucide-react";
import { SEVERITY_COLORS } from "@/lib/severity-utils";

/**
 * Stat Card Component - Displays a single metric
 */
function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue }) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    {Icon && (
                        <div className="p-2 rounded-lg bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 mt-3 text-xs ${
                        trend === 'up' ? 'text-destructive' : 'text-success'
                    }`}>
                        {trend === 'up' ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{trendValue}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Severity Bar Component - Visual representation of vulnerability counts by severity
 */
function SeverityBar({ counts, total }) {
    const getWidth = (count) => total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {counts.Critical > 0 && (
                    <div
                        className="bg-severity-critical transition-all duration-500"
                        style={{ width: `${getWidth(counts.Critical)}%` }}
                    />
                )}
                {counts.High > 0 && (
                    <div
                        className="bg-severity-high transition-all duration-500"
                        style={{ width: `${getWidth(counts.High)}%` }}
                    />
                )}
                {counts.Medium > 0 && (
                    <div
                        className="bg-severity-medium transition-all duration-500"
                        style={{ width: `${getWidth(counts.Medium)}%` }}
                    />
                )}
                {counts.Low > 0 && (
                    <div
                        className="bg-severity-low transition-all duration-500"
                        style={{ width: `${getWidth(counts.Low)}%` }}
                    />
                )}
            </div>
            <div className="flex justify-between text-sm">
                {Object.entries(counts).map(([severity, count]) => (
                    <div key={severity} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[severity]?.bg}`} />
                        <span className={SEVERITY_COLORS[severity]?.text}>{severity}</span>
                        <span className="font-semibold">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Mini Trend Chart - Simple SVG line chart for trends
 */
function MiniTrendChart({ data, color = "stroke-primary" }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 200;
    const height = 60;
    const padding = 5;

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className={color}
            />
            {/* Dots for each data point */}
            {data.map((value, index) => {
                const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
                const y = height - padding - ((value - min) / range) * (height - 2 * padding);
                return (
                    <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="currentColor"
                        className={color.replace('stroke-', 'fill-')}
                    />
                );
            })}
        </svg>
    );
}

/**
 * Vulnerability List Item - Compact list view for vulnerabilities
 */
function VulnerabilityListItem({ vulnerability, onClick }) {
    const severityColor = SEVERITY_COLORS[vulnerability.severity] || SEVERITY_COLORS.Medium;

    return (
        <div
            onClick={() => onClick?.(vulnerability)}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`flex items-center justify-center w-12 h-8 rounded text-sm font-semibold ${severityColor.text}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${severityColor.bg}`} />
                    {vulnerability.cvssScore != null ? vulnerability.cvssScore : '—'}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{vulnerability.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                        {vulnerability.details || vulnerability.explanation}
                    </p>
                </div>
            </div>
            <Badge variant="outline" className="shrink-0">
                {vulnerability.type || '—'}
            </Badge>
        </div>
    );
}

/**
 * Repository Info Card - Shows scan metadata
 */
function RepositoryInfoCard({ repoInfo }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Repository Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Languages</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {repoInfo?.languages?.length > 0 ? repoInfo.languages.map((lang, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                    {lang}
                                </Badge>
                            )) : (
                                <span className="text-xs text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Latest Scan</p>
                        <div className="flex items-center gap-2 mt-1">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{repoInfo?.branch || '—'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {repoInfo?.commit?.slice(0, 7) || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {repoInfo?.lastScanDate || '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Next Scan</p>
                        <Button variant="outline" size="sm" className="mt-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Main Analytics Dashboard Component
 */
export function AnalyticsDashboard({
    vulnerabilities = [],
    workflowRuns = [],
    repoInfo = {},
    dateRange = "7d",
    onDateRangeChange,
    onVulnerabilityClick,
    onExportReport,
    onRefresh,
    isLoading = false,
}) {
    // Calculate statistics
    const stats = useMemo(() => {
        const severityCounts = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0,
        };

        const typeCounts = {};
        const openVulns = vulnerabilities.filter(v => !v.resolved);

        openVulns.forEach(v => {
            if (severityCounts.hasOwnProperty(v.severity)) {
                severityCounts[v.severity]++;
            }
            if (v.type) {
                typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
            }
        });

        return {
            total: vulnerabilities.length,
            open: openVulns.length,
            resolved: vulnerabilities.length - openVulns.length,
            severityCounts,
            typeCounts,
            scansCount: workflowRuns.length,
            prsCreated: workflowRuns.filter(r => r.prCreated).length,
        };
    }, [vulnerabilities, workflowRuns]);

    // Build trend data dynamically from workflow runs
    const trendData = useMemo(() => {
        if (!workflowRuns || workflowRuns.length === 0) return [];

        // Sort runs chronologically and take the last entries
        const sorted = [...workflowRuns]
            .filter(r => r.completedAt)
            .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

        if (sorted.length === 0) return [];

        // Map each run to its vulnerability count
        return sorted.slice(-7).map(run => {
            if (typeof run.vulnerabilityCount === 'number') return run.vulnerabilityCount;
            // Count vulnerabilities belonging to this run
            return vulnerabilities.filter(v => v.workflowRunId === run.id).length;
        });
    }, [workflowRuns, vulnerabilities]);

    // Compute trend direction for stat cards
    const vulnTrend = useMemo(() => {
        if (trendData.length < 2) return null;
        const last = trendData[trendData.length - 1];
        const prev = trendData[trendData.length - 2];
        if (last === prev) return null;
        const diff = last - prev;
        const pct = prev > 0 ? Math.round(Math.abs(diff / prev) * 100) : 0;
        return {
            direction: diff > 0 ? 'up' : 'down',
            value: `${pct}% vs previous scan`,
        };
    }, [trendData]);

    // Zero-data empty state
    if (vulnerabilities.length === 0 && workflowRuns.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Security Data Yet</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Run your first security scan to see vulnerability trends, severity breakdowns, and actionable insights here.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => window.dispatchEvent(new CustomEvent('open-models-dialog'))} className="gap-2">
                        <Activity className="h-4 w-4" />
                        Start a Scan
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Security Overview</h2>
                    <p className="text-muted-foreground">
                        Vulnerability trends and security posture analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={onDateRangeChange}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={onExportReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Vulnerabilities"
                    value={stats.total}
                    subtitle={`${stats.open} open, ${stats.resolved} resolved`}
                    icon={Shield}
                    trend={vulnTrend?.direction}
                    trendValue={vulnTrend?.value}
                />
                <StatCard
                    title="Scans"
                    value={stats.scansCount}
                    subtitle="Total security scans run"
                    icon={Activity}
                />
                <StatCard
                    title="PRs"
                    value={stats.prsCreated}
                    subtitle="Auto-fix pull requests"
                    icon={GitBranch}
                />
                <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                            Vulnerability Trend
                        </p>
                        <MiniTrendChart data={trendData} />
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vulnerability Overview */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">
                            Open Vulnerabilities by Severity
                        </CardTitle>
                        <Badge variant="secondary">{stats.open} total</Badge>
                    </CardHeader>
                    <CardContent>
                        <SeverityBar counts={stats.severityCounts} total={stats.open} />
                    </CardContent>
                </Card>

                {/* Repository Info */}
                <RepositoryInfoCard repoInfo={repoInfo} />
            </div>

            {/* Vulnerabilities List */}
            <Card>
                <CardHeader>
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Open Vulnerabilities</CardTitle>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="critical">Critical</TabsTrigger>
                                <TabsTrigger value="high">High</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="all" className="mt-4">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y">
                                    {vulnerabilities
                                        .filter(v => !v.resolved)
                                        .sort((a, b) => {
                                            const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                                            return (order[a.severity] || 4) - (order[b.severity] || 4);
                                        })
                                        .map((vuln) => (
                                            <VulnerabilityListItem
                                                key={vuln.id}
                                                vulnerability={vuln}
                                                onClick={onVulnerabilityClick}
                                            />
                                        ))}
                                    {vulnerabilities.filter(v => !v.resolved).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Shield className="h-12 w-12 text-success mb-4" />
                                            <p className="text-lg font-medium">No open vulnerabilities</p>
                                            <p className="text-sm text-muted-foreground">
                                                Your code is looking secure!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="critical" className="mt-4">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y">
                                    {vulnerabilities
                                        .filter(v => !v.resolved && v.severity === 'Critical')
                                        .map((vuln) => (
                                            <VulnerabilityListItem
                                                key={vuln.id}
                                                vulnerability={vuln}
                                                onClick={onVulnerabilityClick}
                                            />
                                        ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="high" className="mt-4">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y">
                                    {vulnerabilities
                                        .filter(v => !v.resolved && v.severity === 'High')
                                        .map((vuln) => (
                                            <VulnerabilityListItem
                                                key={vuln.id}
                                                vulnerability={vuln}
                                                onClick={onVulnerabilityClick}
                                            />
                                        ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}

export default AnalyticsDashboard;
