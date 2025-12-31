/**
 * Database Cleanup API
 * ====================
 * 
 * Internal endpoint for cleaning up expired records.
 * Designed to be called by:
 * - AWS EventBridge scheduled rule
 * - ECS scheduled task
 * - Manual invocation for maintenance
 * 
 * SECURITY: This endpoint is protected by a secret key and should NOT
 * be exposed publicly. Configure CLEANUP_API_SECRET in environment.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cleanupExpiredRateLimits } from "@/lib/rate-limit";
import { cleanupOldAuditLogs } from "@/lib/audit-log";

// Verify the cleanup secret to prevent unauthorized access
function verifyCleanupSecret(request) {
    const secret = process.env.CLEANUP_API_SECRET;
    if (!secret) {
        console.warn('[cleanup] CLEANUP_API_SECRET not configured - cleanup disabled');
        return false;
    }
    
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    return providedSecret === secret;
}

export async function POST(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
    
    // SECURITY: Verify cleanup secret
    if (!verifyCleanupSecret(request)) {
        console.warn(`[cleanup] Unauthorized cleanup attempt. RequestId: ${requestId}`);
        return NextResponse.json(
            { error: 'Unauthorized', requestId },
            { status: 401 }
        );
    }
    
    const results = {
        requestId,
        startedAt: new Date().toISOString(),
        tasks: {},
    };
    
    try {
        // 1. Clean up expired rate limit records
        try {
            const rateLimitsCleaned = await cleanupExpiredRateLimits();
            results.tasks.rateLimits = { success: true, cleaned: rateLimitsCleaned };
        } catch (error) {
            results.tasks.rateLimits = { success: false, error: error.message };
        }
        
        // 2. Clean up old audit logs (retain 2 years for GDPR)
        try {
            const auditLogsCleaned = await cleanupOldAuditLogs(730); // 2 years
            results.tasks.auditLogs = { success: true, cleaned: auditLogsCleaned };
        } catch (error) {
            results.tasks.auditLogs = { success: false, error: error.message };
        }
        
        // 3. Clean up expired sessions
        try {
            const sessionResult = await prisma.session.deleteMany({
                where: {
                    expires: { lt: new Date() },
                },
            });
            results.tasks.sessions = { success: true, cleaned: sessionResult.count };
        } catch (error) {
            results.tasks.sessions = { success: false, error: error.message };
        }
        
        // 4. Clean up expired verification tokens
        try {
            const tokenResult = await prisma.verificationToken.deleteMany({
                where: {
                    expires: { lt: new Date() },
                },
            });
            results.tasks.verificationTokens = { success: true, cleaned: tokenResult.count };
        } catch (error) {
            results.tasks.verificationTokens = { success: false, error: error.message };
        }
        
        // 5. Process GDPR deletion requests (soft-deleted users older than 30 days)
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Find users who requested deletion more than 30 days ago
            const usersToDelete = await prisma.user.findMany({
                where: {
                    deletionRequestedAt: { lt: thirtyDaysAgo },
                },
                select: { id: true },
            });
            
            // Hard delete these users (cascade will handle related records)
            if (usersToDelete.length > 0) {
                const deleteResult = await prisma.user.deleteMany({
                    where: {
                        id: { in: usersToDelete.map(u => u.id) },
                    },
                });
                results.tasks.gdprDeletions = { success: true, cleaned: deleteResult.count };
            } else {
                results.tasks.gdprDeletions = { success: true, cleaned: 0 };
            }
        } catch (error) {
            results.tasks.gdprDeletions = { success: false, error: error.message };
        }
        
        // 6. Clean up stale circuit breaker records (inactive for 7+ days)
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const circuitResult = await prisma.$executeRaw`
                DELETE FROM "CircuitBreaker"
                WHERE "updatedAt" < ${sevenDaysAgo}
                AND state = 'CLOSED'
            `;
            results.tasks.circuitBreakers = { success: true, cleaned: circuitResult };
        } catch (error) {
            results.tasks.circuitBreakers = { success: false, error: error.message };
        }
        
        results.completedAt = new Date().toISOString();
        results.success = true;
        
        console.log('[cleanup] Completed successfully:', JSON.stringify(results));
        
        return NextResponse.json(results, { status: 200 });
        
    } catch (error) {
        console.error('[cleanup] Fatal error:', error);
        results.completedAt = new Date().toISOString();
        results.success = false;
        results.error = error.message;
        
        return NextResponse.json(results, { status: 500 });
    }
}

// GET for health check (no auth required)
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Cleanup API is available. POST with Bearer token to run cleanup.',
    });
}
