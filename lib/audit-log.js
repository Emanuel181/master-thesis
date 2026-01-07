/**
 * GDPR-Compliant Audit Logging
 * ============================
 * 
 * Logs user actions for compliance with EU GDPR Article 30 (Records of processing activities).
 * 
 * PRIVACY CONSIDERATIONS:
 * - IP addresses are anonymized (last octet zeroed for IPv4, last 80 bits for IPv6)
 * - User agents are truncated to prevent fingerprinting
 * - No PII is stored in metadata - use resource IDs instead
 * - Logs are retained for the legally required period only
 */

import prisma from "@/lib/prisma";

/**
 * Anonymize IP address for GDPR compliance
 * IPv4: Zero last octet (e.g., 192.168.1.100 -> 192.168.1.0)
 * IPv6: Zero last 80 bits
 * @param {string|null} ip - Raw IP address
 * @returns {string|null} Anonymized IP
 */
function anonymizeIp(ip) {
  if (!ip || ip === 'unknown') return null;
  
  // IPv4
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  
  // IPv6 (simplified - zero last segment)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      // Zero last two segments for privacy
      parts[parts.length - 1] = '0';
      parts[parts.length - 2] = '0';
      return parts.join(':');
    }
  }
  
  return null; // Unknown format - don't store
}

/**
 * Truncate user agent to prevent fingerprinting
 * @param {string|null} userAgent - Raw user agent string
 * @returns {string|null} Truncated user agent (browser + OS only)
 */
function truncateUserAgent(userAgent) {
  if (!userAgent) return null;
  
  // Extract just browser and OS, max 100 chars
  const truncated = userAgent.substring(0, 100);
  
  // Remove specific version numbers that could fingerprint
  return truncated.replace(/\/[\d.]+/g, '/x');
}

/**
 * Audit log action types
 */
export const AuditAction = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  
  // GDPR Rights
  DATA_EXPORT: 'data_export',
  DATA_DELETE_REQUEST: 'data_delete_request',
  CONSENT_GRANTED: 'consent_granted',
  CONSENT_REVOKED: 'consent_revoked',
  
  // Data Modifications
  PROFILE_UPDATE: 'profile_update',
  USE_CASE_CREATE: 'use_case_create',
  USE_CASE_UPDATE: 'use_case_update',
  USE_CASE_DELETE: 'use_case_delete',
  PROMPT_CREATE: 'prompt_create',
  PROMPT_UPDATE: 'prompt_update',
  PROMPT_DELETE: 'prompt_delete',
  PDF_UPLOAD: 'pdf_upload',
  PDF_DELETE: 'pdf_delete',
  
  // Generic CRUD (for supporters, etc.)
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',

  // Admin Actions
  ADMIN_ACCESS_GRANTED: 'admin_access_granted',
  ADMIN_ACCESS_DENIED: 'admin_access_denied',

  // Security Events
  API_ACCESS_DENIED: 'api_access_denied',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
};

/**
 * Log an auditable action
 * 
 * @param {Object} params
 * @param {string|null} params.userId - User ID (null for unauthenticated/system)
 * @param {string} params.action - Action type from AuditAction
 * @param {string} [params.resource] - Resource type (e.g., 'user', 'use_case')
 * @param {string} [params.resourceId] - ID of affected resource
 * @param {Request} [params.request] - HTTP request (for IP/UA extraction)
 * @param {Object} [params.metadata] - Additional context (NO PII!)
 * @returns {Promise<void>}
 */
export async function logAudit({
  userId,
  action,
  resource,
  resourceId,
  request,
  metadata,
}) {
  try {
    // Extract and anonymize request info
    let ipAddress = null;
    let userAgent = null;
    
    if (request) {
      const rawIp = request.headers?.get?.('x-forwarded-for')?.split(',').pop()?.trim()
        || request.headers?.get?.('x-real-ip')
        || null;
      ipAddress = anonymizeIp(rawIp);
      userAgent = truncateUserAgent(request.headers?.get?.('user-agent'));
    }
    
    // Validate userId exists before creating audit log to avoid FK constraint violation
    let validUserId = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      validUserId = userExists ? userId : null;
    }
    
    await prisma.auditLog.create({
      data: {
        userId: validUserId,
        action,
        resource,
        resourceId,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Never fail the main request due to audit logging
    // But do log the error for monitoring
    console.error('[audit-log] Failed to write audit log:', error.message);
  }
}

/**
 * Get audit logs for a user (for GDPR data access requests)
 * 
 * @param {string} userId - User ID
 * @param {Object} [options]
 * @param {number} [options.limit=100] - Max records to return
 * @param {Date} [options.since] - Only logs after this date
 * @returns {Promise<Array>}
 */
export async function getAuditLogsForUser(userId, { limit = 100, since } = {}) {
  return prisma.auditLog.findMany({
    where: {
      userId,
      ...(since && { createdAt: { gte: since } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      createdAt: true,
      // Don't expose IP/UA in user exports
    },
  });
}

/**
 * Cleanup old audit logs (GDPR data minimization)
 * Default retention: 2 years (adjust based on legal requirements)
 * 
 * @param {number} [retentionDays=730] - Days to retain logs
 * @returns {Promise<number>} Number of deleted records
 */
export async function cleanupOldAuditLogs(retentionDays = 730) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    
    console.log(`[audit-log] Cleaned up ${result.count} old audit records`);
    return result.count;
  } catch (error) {
    console.error('[audit-log] Cleanup error:', error.message);
    return 0;
  }
}
