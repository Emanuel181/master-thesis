/**
 * Admin Management API
 * =====================
 * 
 * GET /api/admin/admins - List all admin accounts
 * POST /api/admin/admins - Create/invite a new admin
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
import { emailSchema } from '@/lib/validators/common';

// Verification token expiry (24 hours)
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// POST body schema
const createAdminSchema = z.object({
    email: emailSchema,
}).strict();

/**
 * GET /api/admin/admins - List all admin accounts
 */
export const GET = createAdminApiHandler(
    async (request, { requestId, isMasterAdmin }) => {
        // Only master admin can list admins
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admin can manage admins');
        }

        const admins = await prisma.adminAccount.findMany({
            select: {
                id: true,
                email: true,
                emailVerified: true,
                isMasterAdmin: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get passkey count for each admin in parallel
        const adminsWithPasskeys = await Promise.all(
            admins.map(async (admin) => {
                const passkeyCount = await prisma.adminPasskey.count({
                    where: { email: admin.email.toLowerCase() }
                });
                return { ...admin, passkeyCount };
            })
        );

        return { admins: adminsWithPasskeys };
    },
    {
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'admin:admins:list' },
    }
);

/**
 * POST /api/admin/admins - Create/invite a new admin
 */
export const POST = createAdminApiHandler(
    async (request, { body, requestId, isMasterAdmin }) => {
        // Only master admin can create admins
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admin can create admins');
        }

        const { email } = body;

        // Check if admin already exists
        const existingAdmin = await prisma.adminAccount.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return ApiErrors.forbidden(requestId, 'Admin with this email already exists');
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY_MS);

        // Create admin account (pending verification)
        const newAdmin = await prisma.adminAccount.create({
            data: {
                email,
                verificationToken,
                verificationExpires,
                emailVerified: false,
            }
        });

        // Send verification email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationLink = `${appUrl}/api/admin/verify-email?token=${verificationToken}`;

        await sendEmail({
            to: email,
            subject: 'VulnIQ Admin Invitation - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to VulnIQ Admin</h2>
                    <p>You have been invited to become an administrator on VulnIQ.</p>
                    <p>Click the button below to verify your email address and complete your admin account setup:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 24 hours.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 12px;">VulnIQ Security Platform</p>
                </div>
            `,
            text: `
                Welcome to VulnIQ Admin
                
                You have been invited to become an administrator on VulnIQ.
                
                Click the link below to verify your email address:
                ${verificationLink}
                
                This link will expire in 24 hours.
                
                If you didn't expect this invitation, you can safely ignore this email.
            `
        });

        return {
            message: 'Invitation sent successfully',
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                emailVerified: false,
                createdAt: newAdmin.createdAt,
            }
        };
    },
    {
        bodySchema: createAdminSchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'admin:admins:create' },
    }
);
