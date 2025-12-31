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

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";
import { logAudit, AuditAction, getAuditLogsForUser } from "@/lib/audit-log";

export async function GET(request) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const headers = { ...securityHeaders, 'x-request-id': requestId };

  // SECURITY: Block demo mode
  const demoBlock = requireProductionMode(request, { requestId });
  if (demoBlock) return demoBlock;

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401, headers }
      );
    }

    const userId = session.user.id;

    // Rate limit: 1 export per hour (GDPR allows reasonable limits)
    const rl = await rateLimit({
      key: `gdpr:export:${userId}`,
      limit: 1,
      windowMs: 60 * 60 * 1000, // 1 hour
    });
    
    if (!rl.allowed) {
      return NextResponse.json(
        { 
          error: 'You can only request one data export per hour. Please try again later.',
          retryAt: rl.resetAt,
          requestId,
        },
        { status: 429, headers }
      );
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true, // Needed for portability
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
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers }
      );
    }

    // Get audit logs (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const auditLogs = await getAuditLogsForUser(userId, { 
      limit: 1000, 
      since: twoYearsAgo 
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
        // Don't expose access tokens
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
          ...headers,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="vulniq-data-export-${userId}-${Date.now()}.json"`,
        },
      }
    );
  } catch (error) {
    console.error('[profile/export] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to export data', requestId },
      { status: 500, headers }
    );
  }
}
