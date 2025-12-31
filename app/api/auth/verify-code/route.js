import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp, securityHeaders } from "@/lib/api-security"
import { requireProductionMode } from "@/lib/api-middleware"

// NextAuth hashes tokens before storing them - we need to hash the input to compare
function hashToken(token) {
    return createHash("sha256")
        .update(`${token}${process.env.AUTH_SECRET}`)
        .digest("hex")
}

// GDPR: Hash email for logging to avoid PII exposure
function hashForLog(value) {
    if (!value) return 'null';
    return createHash("sha256").update(value).digest("hex").substring(0, 8);
}

export async function POST(req) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
    
    // SECURITY: Block demo mode from accessing production auth verify-code API
    const demoBlock = requireProductionMode(req);
    if (demoBlock) return demoBlock;
    
    try {
        // Rate Limit (Brute Force Protection)
        const clientIp = getClientIp(req);
        const rl = await rateLimit({
            key: `verify-code:${clientIp}`,
            limit: 5, // Strict limit for verification attempts
            windowMs: 15 * 60 * 1000 // 15 minutes
        });
        
        if (!rl.allowed) {
             return NextResponse.json(
                { error: "Too many attempts. Please try again later." }, 
                { status: 429 }
            );
        }

        const { email, code } = await req.json()

        if (!email || !code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Normalize the code and email (trim whitespace, lowercase email)
        const normalizedCode = code.trim()
        const normalizedEmail = email.trim().toLowerCase()

        // Hash the code the same way NextAuth does
        const hashedCode = hashToken(normalizedCode)

        // GDPR: Log only hashed identifiers, never PII
        if (process.env.NODE_ENV === 'development') {
            console.log(`[verify-code] Checking token. RequestId: ${requestId}, emailHash: ${hashForLog(normalizedEmail)}`);
        }

        // 1. Find the valid verification token in the database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: normalizedEmail,
                token: hashedCode,
            }
        })

        if (!verificationToken) {
            // Token doesn't exist at all - log without PII
            if (process.env.NODE_ENV === 'development') {
                console.log(`[verify-code] No token found. RequestId: ${requestId}`);
            }
            return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 })
        }

        // Check if token has expired
        if (new Date() > verificationToken.expires) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[verify-code] Token expired. RequestId: ${requestId}`);
            }
            return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 })
        }

        // Token is valid - log without PII
        if (process.env.NODE_ENV === 'development') {
            console.log(`[verify-code] Token valid. RequestId: ${requestId}`);
        }
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("[verify-code] Verification error:", error.message)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
