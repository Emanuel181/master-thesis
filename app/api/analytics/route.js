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

        // Fetch the user's workflow runs in the date range.
        // Prisma groupBy does not support relation filters, so we need explicit run IDs.
        const workflowRuns = await prisma.workflowRun.findMany({
            where: {
                userId,
                startedAt: { gte: startDate, lte: endDate },
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
            take: 1000,
        });
        const userRunIds = workflowRuns.map(r => r.id);

        // All vulnerability queries filter by these run IDs + date window
        const vulnWhere = {
            workflowRunId: { in: userRunIds },
            createdAt: { gte: startDate, lte: endDate },
        };

        // Run all independent vulnerability queries in parallel
        const [
            totalVulns,
            resolvedCount,
            severityRows,
            typeRows,
            cweRows,
            confidenceAgg,
            topFilesRows,
            recentVulns,
            vulnDates,
        ] = await Promise.all([
            // Total vulnerability count
            prisma.vulnerability.count({ where: vulnWhere }),

            // Resolved count (used for resolution rate and open count)
            prisma.vulnerability.count({ where: { ...vulnWhere, resolved: true } }),

            // Severity distribution — only open (unresolved) vulnerabilities
            prisma.vulnerability.groupBy({
                by: ['severity'],
                _count: true,
                where: { ...vulnWhere, resolved: false },
            }),

            // Type distribution
            prisma.vulnerability.groupBy({
                by: ['type'],
                _count: true,
                where: vulnWhere,
            }),

            // CWE distribution
            prisma.vulnerability.groupBy({
                by: ['cweId'],
                _count: true,
                where: vulnWhere,
            }),

            // Average confidence score
            prisma.vulnerability.aggregate({
                _avg: { confidence: true },
                where: vulnWhere,
            }),

            // Top 5 most affected files
            prisma.vulnerability.groupBy({
                by: ['fileName'],
                _count: true,
                where: { ...vulnWhere, fileName: { not: null } },
                orderBy: { _count: { fileName: 'desc' } },
                take: 5,
            }),

            // 10 most recent vulnerabilities (for the recent list)
            prisma.vulnerability.findMany({
                where: vulnWhere,
                select: {
                    id: true,
                    title: true,
                    severity: true,
                    type: true,
                    fileName: true,
                    resolved: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),

            // Lightweight date-only fetch for trend calculation
            prisma.vulnerability.findMany({
                where: vulnWhere,
                select: { createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5000,
            }),
        ]);

        // Build severity counts from groupBy rows (open vulns only)
        const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        for (const row of severityRows) {
            if (Object.prototype.hasOwnProperty.call(severityCounts, row.severity)) {
                severityCounts[row.severity] = row._count;
            }
        }

        // Build type counts from groupBy rows
        const typeCounts = {};
        for (const row of typeRows) {
            if (row.type) typeCounts[row.type] = row._count;
        }

        // Build CWE counts from groupBy rows
        const cweCounts = {};
        for (const row of cweRows) {
            if (row.cweId) cweCounts[row.cweId] = row._count;
        }

        // Derived counts
        const openVulnerabilitiesCount = totalVulns - resolvedCount;
        const resolutionRate = totalVulns > 0
            ? Math.round((resolvedCount / totalVulns) * 100)
            : 100;

        // Average confidence (already computed by the DB; may be null)
        const avgConfidence = confidenceAgg._avg.confidence;

        // Top affected files
        const topAffectedFiles = topFilesRows.map(row => ({
            file: row.fileName,
            count: row._count,
        }));

        // Daily trend (calculateTrend only reads .createdAt, so vulnDates works directly)
        const trendData = calculateTrend(vulnDates, days);

        // Scan success rate
        const completedRuns = workflowRuns.filter(r => r.status === 'completed').length;
        const scanSuccessRate = workflowRuns.length > 0
            ? Math.round((completedRuns / workflowRuns.length) * 100)
            : 100;

        return {
            summary: {
                totalVulnerabilities: totalVulns,
                openVulnerabilities: openVulnerabilitiesCount,
                resolvedVulnerabilities: resolvedCount,
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
            recentVulnerabilities: recentVulns,
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
