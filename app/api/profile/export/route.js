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
import { createApiHandler, ApiErrors, successResponse } from '@/lib/api-handler';
import { securityHeaders } from '@/lib/api-security';
import { logAudit, AuditAction, getAuditLogsForUser } from '@/lib/audit-log';

/**
 * GET /api/profile/export
 * Export all user data (GDPR Article 20)
 */
export const GET = createApiHandler(
    async (request, { session, requestId }) => {
        const userId = session.user.id;

        // Fetch all user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                accounts: {
                    select: {
                        provider: true,
                        providerAccountId: true,
                        createdAt: true,
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
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

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
                linkedAt: acc.createdAt,
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

        // Return as downloadable JSON
        return new NextResponse(
            JSON.stringify(exportData, null, 2),
            {
                status: 200,
                headers: {
                    ...securityHeaders,
                    'x-request-id': requestId,
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="vulniq-data-export-${userId}-${Date.now()}.json"`,
                },
            }
        );
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 1,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'gdpr:export',
        },
    }
);
