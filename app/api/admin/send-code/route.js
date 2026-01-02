import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import { isAdminEmail } from "@/lib/supporters-data";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
    storeVerificationCode,
    cleanupExpiredCodes,
    CODE_EXPIRY_MS
} from "@/lib/admin-verification-store";

// Initialize SES Client with correct SES credentials
const ses = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.EMAIL_SERVER_USER || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.EMAIL_SERVER_PASSWORD || process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * POST /api/admin/send-code
 * Sends a verification code to the provided admin email
 * No login session required - standalone OTP flow
 */
export async function POST(request) {
    try {
        // Clean up expired codes
        cleanupExpiredCodes();

        // Parse request body for email
        const bodyResult = await readJsonBody(request);

        if (!bodyResult.ok || !bodyResult.body?.email) {
            return NextResponse.json(
                { error: 'Email address is required' },
                { status: 400, headers: securityHeaders }
            );
        }

        const email = bodyResult.body.email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Rate limiting - strict for code sending (3 per 10 minutes per email)
        const rl = await rateLimit({
            key: `admin:send-code:${email}`,
            limit: 3,
            windowMs: 10 * 60 * 1000 // 10 minutes
        });

        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many code requests. Please wait 10 minutes.' },
                { status: 429, headers: securityHeaders }
            );
        }

        // Check if email is in admin list - only whitelisted emails can receive OTP
        if (!isAdminEmail(email)) {
            return NextResponse.json(
                { error: 'This email is not authorized for admin access.' },
                { status: 403, headers: securityHeaders }
            );
        }

        // Generate and store verification code
        const { code } = storeVerificationCode(email);

        // Send email with verification code
        try {
            const command = new SendEmailCommand({
                Source: process.env.EMAIL_FROM || 'noreply@vulniq.org',
                Destination: { ToAddresses: [email] },
                Message: {
                    Subject: { Data: `VulnIQ Admin Verification Code: ${code}` },
                    Body: {
                        Text: {
                            Data: `Your admin verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.`
                        },
                        Html: {
                            Data: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
    <table style="width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: #22d3ee; margin: 0; font-size: 24px;">🔐 Admin Verification</h1>
            </td>
        </tr>
        <tr>
            <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Your admin verification code is:
                </p>
                <div style="background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: #22d3ee; letter-spacing: 8px; font-family: monospace;">${code}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                    ⏱️ This code expires in <strong>5 minutes</strong>.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    🛡️ This is a security verification for VulnIQ admin access.<br>
                    If you did not request this code, please ignore this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
                            `
                        }
                    }
                }
            });

            await ses.send(command);
        } catch (emailError) {
            console.error('[Admin Send Code - Email Error]', emailError);
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Verification code sent to your email',
                expiresIn: CODE_EXPIRY_MS / 1000
            },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Admin Send Code Error]', error);
        return NextResponse.json(
            { error: 'Failed to send verification code' },
            { status: 500, headers: securityHeaders }
        );
    }
}
