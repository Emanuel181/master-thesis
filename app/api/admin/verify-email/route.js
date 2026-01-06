/**
 * Admin Email Verification
 * 
 * GET /api/admin/verify-email?token=xxx
 * Verifies admin email and generates a password.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/article-emails';

/**
 * Generate a secure random password
 */
function generatePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    // Ensure at least one of each type
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        
        if (!token) {
            return new Response(renderErrorPage('Missing verification token'), {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Find admin with this token
        const admin = await prisma.adminAccount.findUnique({
            where: { verificationToken: token }
        });
        
        if (!admin) {
            return new Response(renderErrorPage('Invalid or expired verification link'), {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Check if token expired
        if (admin.verificationExpires && admin.verificationExpires < new Date()) {
            return new Response(renderErrorPage('Verification link has expired. Please request a new invitation.'), {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Check if already verified
        if (admin.emailVerified) {
            return new Response(renderSuccessPage('Email already verified', 'Your email has already been verified. You can log in to the admin panel.'), {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Generate password
        const plainPassword = generatePassword(16);
        const passwordHash = await bcrypt.hash(plainPassword, 12);
        
        // Update admin account
        await prisma.adminAccount.update({
            where: { id: admin.id },
            data: {
                emailVerified: true,
                passwordHash,
                verificationToken: null,
                verificationExpires: null,
            }
        });
        
        // Send password email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        await sendEmail({
            to: admin.email,
            subject: 'VulnIQ Admin - Your Login Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to VulnIQ Admin!</h2>
                    <p>Your email has been verified. Here are your login credentials:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${admin.email}</p>
                        <p style="margin: 0;"><strong>Password:</strong> <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px;">${plainPassword}</code></p>
                    </div>
                    <p style="color: #d9534f; font-weight: bold;">⚠️ Important Security Notes:</p>
                    <ul style="color: #666;">
                        <li>Save this password securely - it cannot be recovered</li>
                        <li>You will be required to set up a passkey on first login</li>
                        <li>The passkey provides additional security for your account</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${appUrl}/admin/articles" 
                           style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Go to Admin Panel
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 12px;">VulnIQ Security Platform</p>
                </div>
            `,
            text: `
                Welcome to VulnIQ Admin!
                
                Your email has been verified. Here are your login credentials:
                
                Email: ${admin.email}
                Password: ${plainPassword}
                
                Important: Save this password securely - it cannot be recovered.
                You will be required to set up a passkey on first login.
                
                Go to admin panel: ${appUrl}/admin/articles
            `
        });
        
        return new Response(renderSuccessPage(
            'Email Verified Successfully!',
            'Your admin account has been activated. A password has been sent to your email. Please check your inbox (and spam folder) for your login credentials.'
        ), {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        return new Response(renderErrorPage('An error occurred during verification'), {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

function renderSuccessPage(title, message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} - VulnIQ Admin</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                       background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                       min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 12px; max-width: 500px; 
                        text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
                .icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: #22c55e; margin: 0 0 16px 0; }
                p { color: #666; line-height: 1.6; }
                .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                       border-radius: 6px; text-decoration: none; margin-top: 20px; }
                .btn:hover { background: #2563eb; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">✅</div>
                <h1>${title}</h1>
                <p>${message}</p>
                <a href="/admin/articles" class="btn">Go to Admin Panel</a>
            </div>
        </body>
        </html>
    `;
}

function renderErrorPage(message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Failed - VulnIQ Admin</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                       background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                       min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 12px; max-width: 500px; 
                        text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
                .icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: #ef4444; margin: 0 0 16px 0; }
                p { color: #666; line-height: 1.6; }
                .btn { display: inline-block; background: #6b7280; color: white; padding: 12px 24px; 
                       border-radius: 6px; text-decoration: none; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">❌</div>
                <h1>Verification Failed</h1>
                <p>${message}</p>
                <a href="/" class="btn">Go to Homepage</a>
            </div>
        </body>
        </html>
    `;
}
