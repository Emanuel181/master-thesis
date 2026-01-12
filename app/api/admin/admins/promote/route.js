/**
 * Promote User to Admin API
 * ==========================
 * 
 * POST /api/admin/admins/promote - Promote a registered user to admin
 * 
 * Only accessible by the master admin (determined by isMasterAdmin field in database).
 * This allows converting existing app users to admin accounts.
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
import { sendEmail } from '@/lib/article-emails';
import { ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common';

// POST body schema
const promoteSchema = z.object({
    userId: cuidSchema,
}).strict();

/**
 * POST /api/admin/admins/promote - Promote a user to admin
 */
export const POST = createAdminApiHandler(
    async (request, { body, requestId, isMasterAdmin }) => {
        // Only master admin can promote users
        if (!isMasterAdmin) {
            return ApiErrors.forbidden(requestId, 'Only master admin can promote users to admin');
        }

        const { userId } = body;

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
            }
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        if (!user.email) {
            return ApiErrors.forbidden(requestId, 'User does not have an email address');
        }

        const normalizedEmail = user.email.toLowerCase().trim();

        // Check if admin account already exists
        const existingAdmin = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingAdmin) {
            return ApiErrors.forbidden(requestId, 'User is already an admin');
        }

        // Create admin account (already verified since they're a registered user)
        const newAdmin = await prisma.adminAccount.create({
            data: {
                email: normalizedEmail,
                emailVerified: true, // Already verified as they have an account
            }
        });

        // Send notification email (fire-and-forget)
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const adminLoginUrl = `${appUrl}/admin/articles`;

            await sendEmail({
                to: normalizedEmail,
                subject: 'VulnIQ - You have been granted Admin privileges',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Admin Access Granted</h2>
                        <p>Hello ${user.name || user.firstName || 'there'},</p>
                        <p>You have been granted administrator privileges on VulnIQ by the master admin.</p>
                        <p>You can now access the admin panel to manage articles, users, and supporters.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${adminLoginUrl}" 
                               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Access Admin Panel
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            When you first access the admin panel, you'll need to set up a password and passkey for secure access.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px;">VulnIQ Security Platform</p>
                    </div>
                `,
                text: `
                    Admin Access Granted
                    
                    Hello ${user.name || user.firstName || 'there'},
                    
                    You have been granted administrator privileges on VulnIQ by the master admin.
                    
                    Access the admin panel at: ${adminLoginUrl}
                    
                    When you first access the admin panel, you'll need to set up a password and passkey for secure access.
                `
            });
        } catch (emailError) {
            console.error('Failed to send admin notification email:', emailError?.message || 'Unknown error');
            // Don't fail the request if email fails
        }

        return {
            message: `User ${user.email} has been promoted to admin`,
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                emailVerified: true,
                createdAt: newAdmin.createdAt,
                userName: user.name || user.firstName,
            }
        };
    },
    {
        bodySchema: promoteSchema,
        requireMasterAdmin: false, // We check manually for better error message
        rateLimit: { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'admin:admins:promote' },
    }
);
