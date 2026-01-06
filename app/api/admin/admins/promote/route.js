/**
 * Promote User to Admin API
 * 
 * POST /api/admin/admins/promote - Promote a registered user to admin
 * 
 * Only accessible by the master admin (determined by isMasterAdmin field in database).
 * This allows converting existing app users to admin accounts.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/article-emails';

/**
 * POST - Promote a user to admin
 * 
 * Body: { userId: string }
 */
export async function POST(request) {
    try {
        // Use secure cookie-based authentication
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;
        
        // Check if requester is master admin (from database)
        if (!adminCheck.isMasterAdmin) {
            return NextResponse.json({ error: 'Only master admin can promote users to admin' }, { status: 403 });
        }
        
        const { userId } = await request.json();
        
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        
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
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        if (!user.email) {
            return NextResponse.json({ error: 'User does not have an email address' }, { status: 400 });
        }
        
        const normalizedEmail = user.email.toLowerCase().trim();
        
        // Check if admin account already exists
        const existingAdmin = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail }
        });
        
        if (existingAdmin) {
            return NextResponse.json({ error: 'User is already an admin' }, { status: 409 });
        }
        
        // Create admin account (already verified since they're a registered user)
        const newAdmin = await prisma.adminAccount.create({
            data: {
                email: normalizedEmail,
                emailVerified: true, // Already verified as they have an account
            }
        });
        
        // Send notification email
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
            console.error('Failed to send admin notification email:', emailError);
            // Don't fail the request if email fails
        }
        
        return NextResponse.json({
            success: true,
            message: `User ${user.email} has been promoted to admin`,
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                emailVerified: true,
                createdAt: newAdmin.createdAt,
                userName: user.name || user.firstName,
            }
        });
        
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        return NextResponse.json({ error: 'Failed to promote user to admin' }, { status: 500 });
    }
}
