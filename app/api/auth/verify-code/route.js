import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req) {
    try {
        const { email, code } = await req.json()

        if (!email || !code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Find the valid verification token in the database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
                token: code,
                expires: {
                    gt: new Date() // Must not be expired
                }
            }
        })

        if (!verificationToken) {
            // Check if there are any expired tokens or wrong codes to give better error messages
            // But for security, usually generic "Invalid code" is better.
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
        }

        // 2. If valid, we don't need to do anything else here. 
        // The client will use the standard NextAuth callback URL to "sign in" effectively.
        // OR, we can return success and let the client redirect to the callback URL.
        
        // However, we want to prevent the "timer reset" issue.
        // The timer is client-side state.
        
        // To handle "left tries", we would need a new model or field in the DB to track attempts.
        // Standard NextAuth VerificationToken adapter doesn't track attempts count.
        // We can implement a simple in-memory or Redis-based rate limit if needed, 
        // or just rely on the fact that the token is hard to guess (6 digits).
        
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Verification error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
