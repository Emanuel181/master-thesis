/**
 * Admin Passkey Reset
 * 
 * POST /api/admin/passkey/reset
 * Deletes all passkeys for an admin so they can register a new one.
 * Requires password verification for security.
 * 
 * Request body:
 * - email: Admin email
 * - password: Admin password (for verification)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Get admin account from database
        const adminAccount = await prisma.adminAccount.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, passwordHash: true, emailVerified: true }
        });
        
        if (!adminAccount || !adminAccount.emailVerified) {
            return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
        }
        
        // Verify password
        if (!adminAccount.passwordHash) {
            return NextResponse.json({ error: 'Password not set' }, { status: 400 });
        }
        
        const passwordValid = await bcrypt.compare(password, adminAccount.passwordHash);
        
        if (!passwordValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
        
        // Delete all passkeys for this admin
        const deleteResult = await prisma.adminPasskey.deleteMany({
            where: { email: normalizedEmail }
        });
        
        // Also delete any pending challenges
        await prisma.adminPasskeyChallenge.deleteMany({
            where: { email: normalizedEmail }
        });
        
        console.log(`[Passkey Reset] Deleted ${deleteResult.count} passkeys for ${normalizedEmail}`);
        
        return NextResponse.json({
            success: true,
            message: `Deleted ${deleteResult.count} passkey(s). You can now register a new passkey.`,
            deletedCount: deleteResult.count
        });
        
    } catch (error) {
        console.error('Passkey reset error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset passkeys' },
            { status: 500 }
        );
    }
}
