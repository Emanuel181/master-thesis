/**
 * Admin Management - Individual Admin Operations
 * 
 * DELETE /api/admin/admins/[id] - Delete an admin account
 * POST /api/admin/admins/[id] - Resend verification email
 * 
 * Only accessible by the master admin (determined by isMasterAdmin field in database).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/article-emails';
import { requireAdmin } from '@/lib/admin-auth';

// Verification token expiry (24 hours)
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * DELETE - Remove an admin account
 */
export async function DELETE(request, { params }) {
    try {
        // Use secure cookie-based authentication
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;
        
        // Check if requester is master admin (from database)
        if (!adminCheck.isMasterAdmin) {
            return NextResponse.json({ error: 'Only master admin can delete admins' }, { status: 403 });
        }
        
        const { id } = await params;
        
        // Get the admin to delete
        const admin = await prisma.adminAccount.findUnique({
            where: { id }
        });
        
        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }
        
        // Prevent deleting master admin
        if (admin.isMasterAdmin) {
            return NextResponse.json({ error: 'Cannot delete master admin' }, { status: 403 });
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
        
        return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }
}

/**
 * POST - Resend verification email
 */
export async function POST(request, { params }) {
    try {
        // Use secure cookie-based authentication
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;
        
        // Check if requester is master admin (from database)
        if (!adminCheck.isMasterAdmin) {
            return NextResponse.json({ error: 'Only master admin can resend verification' }, { status: 403 });
        }
        
        const { id } = await params;
        const { action } = await request.json();
        
        if (action !== 'resend-verification') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
        
        // Get the admin
        const admin = await prisma.adminAccount.findUnique({
            where: { id }
        });
        
        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }
        
        if (admin.emailVerified) {
            return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
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
        
        return NextResponse.json({ success: true, message: 'Verification email resent' });
        
    } catch (error) {
        console.error('Error resending verification:', error);
        return NextResponse.json({ error: 'Failed to resend verification' }, { status: 500 });
    }
}
