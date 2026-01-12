/**
 * Admin Management - Individual Admin Operations
 * ================================================
 * 
 * DELETE /api/admin/admins/[id] - Delete an admin account
 * POST /api/admin/admins/[id] - Resend verification email
 * 
 * Only accessible by the master admin (determined by isMasterAdmin field in database).
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all inputs
 * - Rate limiting enabled
 * - Master admin requirement enforced
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '@/lib/article-emails';
import { ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common';

// Verification token expiry (24 hours)
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Route params schema
const paramsSchema = z.object({
    id: cuidSchema,
});

// POST body schema
const actionSchema = z.object({
    action: z.literal('resend-verification'),
}).strict();

/**
 * DELETE /api/admin/admins/[id] - Remove an admin account
 */
export const DELETE = createAdminApiHandler(
    async (request, { params, requestId, isMasterAdmin }) => {
        // Only master admin can delete admins
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admin can delete admins');
        }

        const { id } = params;

        // Get the admin to delete
        const admin = await prisma.adminAccount.findUnique({
            where: { id }
        });

        if (!admin) {
            return ApiErrors.notFound('Admin', requestId);
        }

        // Prevent deleting master admin
        if (admin.isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Cannot delete master admin');
        }

        // Delete associated passkeys first
        await prisma.adminPasskey.deleteMany({
            where: { email: admin.email.toLowerCase() }
        });

        // Delete associated challenges
        await prisma.adminPasskeyChallenge.deleteMany({
            where: { email: admin.email.toLowerCase() }
        });

        // Delete the admin account
        await prisma.adminAccount.delete({
            where: { id }
        });

        return { message: 'Admin deleted successfully' };
    },
    {
        paramsSchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'admin:admins:delete' },
    }
);

/**
 * POST /api/admin/admins/[id] - Resend verification email
 */
export const POST = createAdminApiHandler(
    async (request, { params, body, requestId, isMasterAdmin }) => {
        // Only master admin can resend verification
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admin can resend verification');
        }

        const { id } = params;
        const { action } = body;

        if (action !== 'resend-verification') {
            return ApiErrors.forbidden(requestId, 'Invalid action');
        }

        // Get the admin
        const admin = await prisma.adminAccount.findUnique({
            where: { id }
        });

        if (!admin) {
            return ApiErrors.notFound('Admin', requestId);
        }

        if (admin.emailVerified) {
            return ApiErrors.forbidden(requestId, 'Email already verified');
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY_MS);

        await prisma.adminAccount.update({
            where: { id },
            data: {
                verificationToken,
                verificationExpires,
            }
        });

        // Send verification email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationLink = `${appUrl}/api/admin/verify-email?token=${verificationToken}`;

        await sendEmail({
            to: admin.email,
            subject: 'VulnIQ Admin Invitation - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to VulnIQ Admin</h2>
                    <p>You have been invited to become an administrator on VulnIQ.</p>
                    <p>Click the button below to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                </div>
            `,
            text: `Verify your email: ${verificationLink}`
        });

        return { message: 'Verification email resent' };
    },
    {
        paramsSchema,
        bodySchema: actionSchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'admin:admins:resend' },
    }
);
