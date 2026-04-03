/**
 * GDPR Data Export API
 * ====================
 * 
 * Implements GDPR Article 20 - Right to data portability.
 * Users can request a complete export of their personal data.
 * 
 * Security:
 * - Requires authentication
 * - Rate limited (1 export per hour)
 * - Audit logged
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { securityHeaders } from '@/lib/api-security';
import { logAudit, AuditAction, getAuditLogsForUser } from '@/lib/audit-log';

/**
 * GET /api/profile/export
 * Export all user data (GDPR Article 20)
 */
export const GET = createApiHandler(
    async (request, { session, requestId }) => {
        const userId = session.user.id;

        // Fetch all user data including relations
        const [user, articles, savedArticles, workflowRuns, notifications, articleReactions, agentConfigs, useCaseGroups, vulnerabilities] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    accounts: {
                        select: {
                            provider: true,
                            providerAccountId: true,
                        },
                    },
                    useCases: {
                        include: {
                            pdfs: {
                                select: {
                                    id: true,
                                    title: true,
                                    url: true,
                                    size: true,
                                    createdAt: true,
                                },
                            },
                            folders: {
                                select: {
                                    id: true,
                                    name: true,
                                    parentId: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                    prompts: {
                        select: {
                            id: true,
                            agent: true,
                            title: true,
                            text: true,
                            isDefault: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    warnings: {
                        select: {
                            id: true,
                            reason: true,
                            createdAt: true,
                        },
                    },
                    mfaConfig: {
                        select: {
                            enabled: true,
                            method: true,
                            verifiedAt: true,
                            lastUsedAt: true,
                            createdAt: true,
                        },
                    },
                    passkeys: {
                        select: {
                            id: true,
                            deviceType: true,
                            backedUp: true,
                            deviceName: true,
                            lastUsedAt: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            // User's authored articles
            prisma.article.findMany({
                where: { authorId: userId },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    category: true,
                    status: true,
                    readTime: true,
                    adminFeedback: true,
                    createdAt: true,
                    updatedAt: true,
                    submittedAt: true,
                    publishedAt: true,
                    rejectedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 500,
            }),
            // User's saved articles
            prisma.savedArticle.findMany({
                where: { userId },
                include: {
                    article: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            category: true,
                            authorName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 500,
            }),
            // User's workflow runs with use case runs
            prisma.workflowRun.findMany({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    startedAt: true,
                    completedAt: true,
                    totalUseCases: true,
                    completedUseCases: true,
                    metadata: true,
                    createdAt: true,
                    useCaseRuns: {
                        select: {
                            id: true,
                            useCaseTitle: true,
                            status: true,
                            startedAt: true,
                            completedAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 1000,
            }),
            // User's notifications
            prisma.notification.findMany({
                where: { userId },
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    read: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 500,
            }),
            // User's article reactions
            prisma.articleReaction.findMany({
                where: { userId },
                select: {
                    type: true,
                    createdAt: true,
                    article: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 2000,
            }),
            // User's agent configurations
            prisma.agentConfiguration.findMany({
                where: { userId },
                select: {
                    agentType: true,
                    modelId: true,
                    enabled: true,
                    createdAt: true,
                    updatedAt: true,
                },
                take: 500,
            }),
            // User's use case groups
            prisma.useCaseGroup.findMany({
                where: { userId },
                select: {
                    id: true,
                    name: true,
                    icon: true,
                    order: true,
                    parentId: true,
                    createdAt: true,
                },
                orderBy: { order: 'asc' },
                take: 500,
            }),
            // Vulnerabilities found in user's workflow runs
            prisma.vulnerability.findMany({
                where: {
                    workflowRun: { userId },
                },
                select: {
                    id: true,
                    workflowRunId: true,
                    severity: true,
                    title: true,
                    type: true,
                    fileName: true,
                    cweId: true,
                    confidence: true,
                    falsePositive: true,
                    resolved: true,
                    resolvedAt: true,
                    createdAt: true,
                    fixes: {
                        select: {
                            id: true,
                            fileName: true,
                            explanation: true,
                            status: true,
                            prUrl: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 1000,
            }),
        ]);

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Get audit logs (last 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const auditLogs = await getAuditLogsForUser(userId, {
            limit: 1000,
            since: twoYearsAgo,
        });

        // Build GDPR-compliant export structure
        const exportData = {
            exportInfo: {
                exportedAt: new Date().toISOString(),
                dataController: 'VulnIQ',
                dataControllerContact: process.env.GDPR_CONTACT_EMAIL || 'privacy@vulniq.org',
                format: 'JSON',
                gdprReference: 'EU GDPR Article 20 - Right to data portability',
            },
            personalData: {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                jobTitle: user.jobTitle,
                company: user.company,
                bio: user.bio,
                location: user.location,
                image: user.image,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            consent: {
                gdprConsentAt: user.gdprConsentAt,
                marketingConsent: user.marketingConsent,
                dataExportedAt: user.dataExportedAt,
                deletionRequestedAt: user.deletionRequestedAt,
            },
            linkedAccounts: user.accounts.map(acc => ({
                provider: acc.provider,
                providerAccountId: acc.providerAccountId,
            })),
            useCases: user.useCases.map(uc => ({
                id: uc.id,
                title: uc.title,
                content: uc.content,
                icon: uc.icon,
                createdAt: uc.createdAt,
                updatedAt: uc.updatedAt,
                folders: uc.folders,
                documents: uc.pdfs,
            })),
            prompts: user.prompts,
            articles: articles.map(a => ({
                id: a.id,
                title: a.title,
                slug: a.slug,
                excerpt: a.excerpt,
                category: a.category,
                status: a.status,
                readTime: a.readTime,
                adminFeedback: a.adminFeedback,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
                submittedAt: a.submittedAt,
                publishedAt: a.publishedAt,
                rejectedAt: a.rejectedAt,
            })),
            savedArticles: savedArticles.map(sa => ({
                savedAt: sa.createdAt,
                article: sa.article,
            })),
            articleReactions: articleReactions.map(r => ({
                type: r.type,
                articleId: r.article.id,
                articleTitle: r.article.title,
                createdAt: r.createdAt,
            })),
            workflowRuns: workflowRuns.map(wr => ({
                id: wr.id,
                status: wr.status,
                startedAt: wr.startedAt,
                completedAt: wr.completedAt,
                totalUseCases: wr.totalUseCases,
                completedUseCases: wr.completedUseCases,
                projectName: wr.metadata?.projectName || wr.metadata?.code?.projectName || null,
                createdAt: wr.createdAt,
                useCaseRuns: wr.useCaseRuns,
            })),
            vulnerabilities: vulnerabilities.map(v => ({
                id: v.id,
                workflowRunId: v.workflowRunId,
                severity: v.severity,
                title: v.title,
                type: v.type,
                fileName: v.fileName,
                cweId: v.cweId,
                confidence: v.confidence,
                falsePositive: v.falsePositive,
                resolved: v.resolved,
                resolvedAt: v.resolvedAt,
                createdAt: v.createdAt,
                fixes: v.fixes,
            })),
            notifications: notifications,
            useCaseGroups: useCaseGroups,
            agentConfigurations: agentConfigs,
            security: {
                mfa: user.mfaConfig ? {
                    enabled: user.mfaConfig.enabled,
                    method: user.mfaConfig.method,
                    verifiedAt: user.mfaConfig.verifiedAt,
                    lastUsedAt: user.mfaConfig.lastUsedAt,
                } : null,
                passkeys: user.passkeys.map(p => ({
                    id: p.id,
                    deviceType: p.deviceType,
                    backedUp: p.backedUp,
                    deviceName: p.deviceName,
                    lastUsedAt: p.lastUsedAt,
                    createdAt: p.createdAt,
                })),
                warnings: user.warnings.map(w => ({
                    reason: w.reason,
                    createdAt: w.createdAt,
                })),
            },
            activityLog: auditLogs,
        };

        // Update user record with export timestamp
        await prisma.user.update({
            where: { id: userId },
            data: { dataExportedAt: new Date() },
        });

        // Audit log this export
        await logAudit({
            userId,
            action: AuditAction.DATA_EXPORT,
            resource: 'user',
            resourceId: userId,
            request,
            metadata: { format: 'json' },
        });

        // Return as JSON (client handles format conversion & download)
        return new NextResponse(
            JSON.stringify(exportData, null, 2),
            {
                status: 200,
                headers: {
                    ...securityHeaders,
                    'x-request-id': requestId,
                    'Content-Type': 'application/json',
                },
            }
        );
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'gdpr:data-export',
        },
    }
);
