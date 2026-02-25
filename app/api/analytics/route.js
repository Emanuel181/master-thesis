/**
 * Analytics API Route
 * ===================
 *
 * GET /api/analytics - Fetch security analytics and trends
 *
 * Query Parameters:
 * - range: '7d' | '30d' | '90d' | '1y' (default: '7d')
 * - userId: optional user filter (admin only)
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createApiHandler, ApiErrors } from "@/lib/api-handler";

const querySchema = z.object({
    range: z.enum(['7d', '30d', '90d', '1y']).default('7d'),
});

/**
 * Calculate date range from query parameter
 */
function getDateRange(range) {
    const now = new Date();
    const ranges = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
    };
    const days = ranges[range] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate, endDate: now, days };
}

/**
 * GET /api/analytics
 */
export const GET = createApiHandler(
    async (request, { session, query }) => {
        const { range } = query;
        const { startDate, endDate, days } = getDateRange(range);
        const userId = session.user.id;

        // Fetch vulnerabilities within date range
        const vulnerabilities = await prisma.vulnerability.findMany({
            where: {
                workflowRun: {
                    userId,
                },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                severity: true,
                type: true,
                title: true,
                fileName: true,
                resolved: true,
                confidence: true,
                createdAt: true,
                cweId: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Fetch workflow runs within date range
        const workflowRuns = await prisma.workflowRun.findMany({
            where: {
                userId,
                startedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                totalUseCases: true,
                completedUseCases: true,
            },
            orderBy: { startedAt: 'desc' },
        });

        // Calculate severity counts
        const severityCounts = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0,
        };

        const openVulns = vulnerabilities.filter(v => !v.resolved);
        openVulns.forEach(v => {
            if (severityCounts.hasOwnProperty(v.severity)) {
                severityCounts[v.severity]++;
            }
        });

        // Calculate type distribution
        const typeCounts = {};
        vulnerabilities.forEach(v => {
            if (v.type) {
                typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
            }
        });

        // Calculate CWE distribution
        const cweCounts = {};
        vulnerabilities.forEach(v => {
            if (v.cweId) {
                cweCounts[v.cweId] = (cweCounts[v.cweId] || 0) + 1;
            }
        });

        // Calculate daily trend data
        const trendData = calculateTrend(vulnerabilities, days);

        // Calculate resolution rate
        const totalVulns = vulnerabilities.length;
        const resolvedVulns = vulnerabilities.filter(v => v.resolved).length;
        const resolutionRate = totalVulns > 0
            ? Math.round((resolvedVulns / totalVulns) * 100)
            : 100;

        // Calculate average confidence (only from vulns that have a confidence value)
        const vulnsWithConfidence = vulnerabilities.filter(v => v.confidence != null);
        const avgConfidence = vulnsWithConfidence.length > 0
            ? vulnsWithConfidence.reduce((sum, v) => sum + v.confidence, 0) / vulnsWithConfidence.length
            : null;

        // Calculate scan success rate
        const completedRuns = workflowRuns.filter(r => r.status === 'completed').length;
        const scanSuccessRate = workflowRuns.length > 0
            ? Math.round((completedRuns / workflowRuns.length) * 100)
            : 100;

        // Get most affected files
        const fileCounts = {};
        vulnerabilities.forEach(v => {
            if (v.fileName) {
                fileCounts[v.fileName] = (fileCounts[v.fileName] || 0) + 1;
            }
        });
        const topAffectedFiles = Object.entries(fileCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([file, count]) => ({ file, count }));

        return {
            summary: {
                totalVulnerabilities: totalVulns,
                openVulnerabilities: openVulns.length,
                resolvedVulnerabilities: resolvedVulns,
                severityCounts,
                typeCounts,
                cweCounts,
                resolutionRate,
                avgConfidence: Math.round(avgConfidence * 100),
                totalScans: workflowRuns.length,
                scanSuccessRate,
            },
            trends: {
                vulnerabilities: trendData,
                period: range,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            topAffectedFiles,
            recentVulnerabilities: vulnerabilities.slice(0, 10).map(v => ({
                id: v.id,
                title: v.title,
                severity: v.severity,
                type: v.type,
                fileName: v.fileName,
                resolved: v.resolved,
                createdAt: v.createdAt,
            })),
            workflowRuns: workflowRuns.slice(0, 10).map(r => ({
                id: r.id,
                status: r.status,
                startedAt: r.startedAt,
                completedAt: r.completedAt,
            })),
        };
    },
    {
        requireAuth: true,
        querySchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'analytics',
        },
    }
);

/**
 * Calculate daily vulnerability trend
 */
function calculateTrend(vulnerabilities, days) {
    const now = new Date();
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        const count = vulnerabilities.filter(v => {
            const vulnDate = new Date(v.createdAt).toISOString().split('T')[0];
            return vulnDate === dateStr;
        }).length;

        trend.push({
            date: dateStr,
            count,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
    }

    return trend;
}
