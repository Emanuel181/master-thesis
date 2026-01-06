/**
 * Admin Management API
 * 
 * GET /api/admin/admins - List all admin accounts
 * POST /api/admin/admins - Create/invite a new admin
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
 * GET - List all admin accounts
 */
export async function GET(request) {
    try {
        // Use secure cookie-based authentication
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;
        
        // Check if requester is master admin (from database)
        if (!adminCheck.isMasterAdmin) {
            return NextResponse.json({ error: 'Only master admin can manage admins' }, { status: 403 });
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
        
        // Also get passkey count for each admin
        const adminsWithPasskeys = await Promise.all(
            admins.map(async (admin) => {
                const passkeyCount = await prisma.adminPasskey.count({
                    where: { email: admin.email.toLowerCase() }
                });
                return { ...admin, passkeyCount };
            })
        );
        
        return NextResponse.json({ admins: adminsWithPasskeys });
        
    } catch (error) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }
}

/**
 * POST - Create/invite a new admin
 */
export async function POST(request) {
    try {
        // Use secure cookie-based authentication
        const adminCheck = await requireAdmin();
        if (adminCheck.error) return adminCheck.error;
        
        // Check if requester is master admin (from database)
        if (!adminCheck.isMasterAdmin) {
            return NextResponse.json({ error: 'Only master admin can create admins' }, { status: 403 });
        }
        
        const { email } = await request.json();
        
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }
        
        // Check if admin already exists
        const existingAdmin = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail }
        });
        
        if (existingAdmin) {
            return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });
        }
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY_MS);
        
        // Create admin account (pending verification)
        const newAdmin = await prisma.adminAccount.create({
            data: {
                email: normalizedEmail,
                verificationToken,
                verificationExpires,
                emailVerified: false,
            }
        });
        
        // Send verification email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationLink = `${appUrl}/api/admin/verify-email?token=${verificationToken}`;
        
        await sendEmail({
            to: normalizedEmail,
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
        
        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully',
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                emailVerified: false,
                createdAt: newAdmin.createdAt,
            }
        });
        
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
}
