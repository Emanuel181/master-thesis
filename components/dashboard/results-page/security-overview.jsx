"use client";

import React, { useState, useMemo } from "react";
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
    GitBranch,
    Calendar,
    Download,
    ChevronDown,
    Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { VulnerabilityDetailSheet } from "./vulnerability-detail-sheet";
import { EndpointsView } from "./endpoints-view";
import { SEVERITY_COLORS, getSeverityColors } from "@/lib/severity-utils";
import { UNDERLINE_TAB } from "@/lib/tab-variants";
import {
    downloadHtmlReport,
    exportToPdf,
    downloadCsvReport
} from "@/lib/report-export";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Stat Card Component - matches the reference design
 */
function StatCard({ title, value }) {
    return (
        <div className="p-6">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
    );
}

/**
 * Severity Count with vertical bar - matches reference exactly
 */
function SeverityCount({ severity, count }) {
    const colors = getSeverityColors(severity);

    return (
        <div className="flex items-start gap-2">
            <div className={`w-1 h-12 rounded-full ${colors.bar}`} />
            <div>
                <span className={`text-sm ${colors.text}`}>{severity}</span>
                <p className={`text-3xl font-bold ${colors.text}`}>{count}</p>
            </div>
        </div>
    );
}

/**
 * Horizontal severity bar showing distribution
 */
function SeverityProgressBar({ counts, total }) {
    if (total === 0) return null;
    
    const getWidth = (count) => `${(count / total) * 100}%`;
    
    return (
        <div className="flex h-2 rounded-full overflow-hidden bg-muted mt-4">
            {counts.Critical > 0 && (
                <div className="bg-severity-critical" style={{ width: getWidth(counts.Critical) }} />
            )}
            {counts.High > 0 && (
                <div className="bg-severity-high" style={{ width: getWidth(counts.High) }} />
            )}
            {counts.Medium > 0 && (
                <div className="bg-severity-medium" style={{ width: getWidth(counts.Medium) }} />
            )}
            {counts.Low > 0 && (
                <div className="bg-severity-low" style={{ width: getWidth(counts.Low) }} />
            )}
        </div>
    );
}

/**
 * Mini Line Chart (SVG) - matches reference red dashed line style
 */
function TrendChart({ data, width = 450, height = 120 }) {
    if (!data || data.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-1">
                <Shield className="h-6 w-6 mb-1" />
                <span>No trend data yet</span>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d.count), 4);
    const padding = { top: 20, right: 20, bottom: 30, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (d.count / max) * chartHeight;
        return { x, y, ...d };
    });

    const linePath = points.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            {/* Y-axis gridlines and labels */}
            {[0, 1, 2, 3, 4].map(i => {
                const y = padding.top + (chartHeight / 4) * (4 - i);
                return (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={y}
                            x2={width - padding.right}
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity={0.1}
                        />
                        <text
                            x={padding.left - 10}
                            y={y + 4}
                            fontSize={11}
                            fill="currentColor"
                            opacity={0.5}
                            textAnchor="end"
                        >
                            {i}
                        </text>
                    </g>
                );
            })}

            {/* Line - red dashed */}
            <path
                d={linePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6,4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {points.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill="#ef4444"
                />
            ))}

            {/* X-axis labels */}
            {points.map((p, i) => (
                <text
                    key={i}
                    x={p.x}
                    y={height - 8}
                    fontSize={11}
                    fill="currentColor"
                    opacity={0.5}
                    textAnchor="middle"
                >
                    {p.label}
                </text>
            ))}
        </svg>
    );
}

/**
 * Vulnerability List Item - matches reference exactly
 */
function VulnerabilityRow({ vulnerability, onClick }) {
    const colors = SEVERITY_COLORS[vulnerability.severity] || SEVERITY_COLORS.Medium;
    const cvssScore = vulnerability.cvssScore;

    return (
        <div
            onClick={() => onClick?.(vulnerability)}
            className="flex items-start gap-4 py-4 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
        >
            {/* CVSS Score with colored dot */}
            <div className="flex items-center gap-2 min-w-15">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                <span className={`font-semibold ${colors.text}`}>
                    {cvssScore != null ? cvssScore.toFixed(1) : '—'}
                </span>
            </div>
            
            {/* Title and description */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{vulnerability.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {vulnerability.explanation || vulnerability.details}
                </p>
            </div>
            
            {/* Type badge */}
            <div className="text-right min-w-[140px]">
                <span className="text-sm text-muted-foreground">
                    {vulnerability.type || '—'}
                </span>
            </div>
        </div>
    );
}

/**
 * Repository Info Card - matches reference
 */
function RepositoryInfo({ info }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Repository Info</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <p className="text-muted-foreground mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                            {info.languages?.length > 0 ? info.languages.map((lang, i) => (
                                <Badge key={i} variant="secondary" className="text-xs px-2">{lang}</Badge>
                            )) : (
                                <span className="text-xs text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-2">Latest Scan</p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{info.branch || '—'}</span>
                            </div>
                            <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                                <span className="inline-block w-3.5 text-center">⊙</span>
                                {info.commit || '—'}
                            </p>
                            <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                                <span className="inline-block w-3.5 text-center">◷</span>
                                {info.lastScanDate || '—'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-2">Next Scan</p>
                        <Button variant="outline" size="sm" className="h-8">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Schedule
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Main Security Overview Component
 */
export function SecurityOverview({
    vulnerabilities: initialVulnerabilities = [],
    workflowRuns = [],
    trendData: initialTrendData = null,
    repoInfo = {},
}) {
    const [dateRange, setDateRange] = useState("7d");
    const [selectedVuln, setSelectedVuln] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Use provided data directly — no sample/fallback data
    const vulnerabilities = useMemo(() => initialVulnerabilities, [initialVulnerabilities]);

    // Trend data for chart
    const trendData = useMemo(() => initialTrendData || [], [initialTrendData]);

    // Calculate summary stats
    const stats = useMemo(() => {
        const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        const openVulns = vulnerabilities.filter(v => !v.resolved);

        openVulns.forEach(v => {
            if (severityCounts.hasOwnProperty(v.severity)) {
                severityCounts[v.severity]++;
            }
        });

        return {
            total: vulnerabilities.length,
            open: openVulns.length,
            severityCounts,
            scans: workflowRuns.length,
            prs: workflowRuns.filter(r => r.prCreated).length,
        };
    }, [vulnerabilities, workflowRuns]);

    // Filter and sort vulnerabilities
    const filteredVulns = useMemo(() => {
        let result = vulnerabilities.filter(v => !v.resolved);
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(v =>
                v.title?.toLowerCase().includes(query) ||
                v.type?.toLowerCase().includes(query) ||
                v.fileName?.toLowerCase().includes(query)
            );
        }

        // Sort by severity (default)
        result.sort((a, b) => {
            const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
            return (order[a.severity] || 4) - (order[b.severity] || 4);
        });

        return result;
    }, [vulnerabilities, searchQuery]);

    // Handle vulnerability click
    const handleVulnClick = (vuln) => {
        setSelectedVuln(vuln);
        setDetailOpen(true);
    };

    // Handle export
    const handleExport = (format) => {
        // Build dynamic recommendations from actual vulnerability data
        const recommendations = [];
        if (stats.severityCounts.Critical > 0) {
            recommendations.push(`Address ${stats.severityCounts.Critical} critical vulnerabilit${stats.severityCounts.Critical === 1 ? 'y' : 'ies'} immediately`);
        }
        if (stats.severityCounts.High > 0) {
            recommendations.push(`Remediate ${stats.severityCounts.High} high-severity vulnerabilit${stats.severityCounts.High === 1 ? 'y' : 'ies'} as a priority`);
        }
        if (stats.severityCounts.Medium > 0) {
            recommendations.push(`Review and plan fixes for ${stats.severityCounts.Medium} medium-severity finding${stats.severityCounts.Medium === 1 ? '' : 's'}`);
        }
        if (stats.severityCounts.Low > 0) {
            recommendations.push(`Evaluate ${stats.severityCounts.Low} low-severity finding${stats.severityCounts.Low === 1 ? '' : 's'} for potential hardening`);
        }

        // Extract unique vulnerability types for context
        const uniqueTypes = [...new Set(vulnerabilities.map(v => v.type).filter(Boolean))];
        if (uniqueTypes.length > 0) {
            recommendations.push(`Focus areas: ${uniqueTypes.slice(0, 5).join(', ')}`);
        }

        const reportData = {
            title: 'Security Assessment Report',
            vulnerabilities: vulnerabilities,
            summary: {
                text: `Found ${stats.total} vulnerabilities across ${stats.scans} scan${stats.scans === 1 ? '' : 's'}.`,
                recommendations,
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                projectName: repoInfo.name || 'Security Scan',
            },
        };

        switch (format) {
            case 'pdf':
                exportToPdf(reportData);
                break;
            case 'html':
                downloadHtmlReport(reportData);
                break;
            case 'csv':
                downloadCsvReport(vulnerabilities);
                break;
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
                {/* Navigation Bar */}
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="overview" className={UNDERLINE_TAB}>
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="vulnerabilities" className={UNDERLINE_TAB}>
                            Vulnerabilities
                            {stats.open > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-destructive/10 text-destructive rounded-full font-medium">
                                    {stats.open}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="endpoints" className={UNDERLINE_TAB}>
                            Endpoints
                        </TabsTrigger>
                        <TabsTrigger value="scans" className={UNDERLINE_TAB}>
                            Scans
                            {workflowRuns.length > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full font-medium">
                                    {workflowRuns.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats Cards */}
                        <Card className="lg:col-span-2">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-3 divide-x">
                                    <StatCard title="Total Vulnerabilities" value={stats.total} />
                                    <StatCard title="Scans" value={stats.scans} />
                                    <StatCard title="PRs" value={stats.prs} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Repository Info */}
                        <RepositoryInfo info={repoInfo} />
                    </div>

                    {/* Chart and Severity Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Trend Chart */}
                        <Card className="lg:col-span-2">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-end mb-4">
                                    <Select value={dateRange} onValueChange={setDateRange}>
                                        <SelectTrigger className="w-[140px] h-8 text-sm">
                                            <Calendar className="h-3.5 w-3.5 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7d">Last 7 days</SelectItem>
                                            <SelectItem value="30d">Last 30 days</SelectItem>
                                            <SelectItem value="90d">Last 90 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <TrendChart data={trendData} width={500} height={140} />
                            </CardContent>
                        </Card>

                        {/* Severity Breakdown */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Open Vulnerabilities by Severity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    <SeverityCount severity="Critical" count={stats.severityCounts.Critical} />
                                    <SeverityCount severity="High" count={stats.severityCounts.High} />
                                    <SeverityCount severity="Medium" count={stats.severityCounts.Medium} />
                                    <SeverityCount severity="Low" count={stats.severityCounts.Low} />
                                </div>
                                <SeverityProgressBar counts={stats.severityCounts} total={stats.open} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Open Vulnerabilities Section */}
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-semibold">Open Vulnerabilities</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Table Header */}
                            <div className="flex items-center gap-4 px-4 py-3 border-b text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 min-w-[60px] cursor-pointer hover:text-foreground">
                                    Severity
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">Title</div>
                                <div className="min-w-[140px] text-right">Type</div>
                            </div>

                            {/* Vulnerabilities List */}
                            <ScrollArea className="h-96">
                                {filteredVulns.map((vuln) => (
                                    <VulnerabilityRow
                                        key={vuln.id}
                                        vulnerability={vuln}
                                        onClick={handleVulnClick}
                                    />
                                ))}
                                {filteredVulns.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <Shield className="h-12 w-12 text-success mb-4" />
                                        <p className="text-lg font-medium">No open vulnerabilities</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your code is looking secure!
                                        </p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vulnerabilities Tab */}
                <TabsContent value="vulnerabilities" className="mt-0">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>All Vulnerabilities</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search vulnerabilities..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-[280px]"
                                        />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button>
                                                <Download className="h-4 w-4 mr-2" />
                                                Export
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                                Export as PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('html')}>
                                                Export as HTML
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                                Export as CSV
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex items-center gap-4 px-4 py-3 border-b text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 min-w-[60px]">Severity</div>
                                <div className="flex-1">Title</div>
                                <div className="min-w-[140px] text-right">Type</div>
                            </div>
                            <ScrollArea className="h-[32rem]">
                                {filteredVulns.map((vuln) => (
                                    <VulnerabilityRow
                                        key={vuln.id}
                                        vulnerability={vuln}
                                        onClick={handleVulnClick}
                                    />
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Endpoints Tab */}
                <TabsContent value="endpoints" className="mt-0">
                    <EndpointsView />
                </TabsContent>

                {/* Scans Tab */}
                <TabsContent value="scans" className="mt-0">
                    <Card>
                        <CardContent className="p-0">
                            {workflowRuns.length > 0 ? (
                                <>
                                    {/* Table header */}
                                    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
                                        <div className="w-[180px]">Date</div>
                                        <div className="flex-1">Status</div>
                                        <div className="w-[120px] text-center">Vulnerabilities</div>
                                        <div className="w-[120px] text-center">Duration</div>
                                    </div>
                                    <ScrollArea className="h-96">
                                        {[...workflowRuns]
                                            .sort((a, b) => new Date(b.completedAt || b.startedAt) - new Date(a.completedAt || a.startedAt))
                                            .map((run, i) => (
                                            <div key={run.id || i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                                                <div className="w-[180px] text-sm">
                                                    {run.completedAt ? new Date(run.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </div>
                                                <div className="flex-1">
                                                    <Badge variant={run.status === 'completed' || run.status === 'COMPLETED' ? 'success' : run.status === 'failed' || run.status === 'FAILED' ? 'destructive' : 'secondary'} className="text-xs">
                                                        {run.status || '—'}
                                                    </Badge>
                                                </div>
                                                <div className="w-[120px] text-center text-sm font-medium">
                                                    {typeof run.vulnerabilityCount === 'number' ? run.vulnerabilityCount : '—'}
                                                </div>
                                                <div className="w-[120px] text-center text-sm text-muted-foreground">
                                                    {run.completedAt && run.startedAt
                                                        ? `${Math.round((new Date(run.completedAt) - new Date(run.startedAt)) / 1000)}s`
                                                        : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-4">
                                        <Shield className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-base font-medium">No scans yet</p>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                        Run a security scan to see your history here.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Vulnerability Detail Sheet */}
            <VulnerabilityDetailSheet
                vulnerability={selectedVuln}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onOpenFile={(vuln) => {
                }}
            />
        </div>
    );
}

export default SecurityOverview;
