import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

// NextAuth hashes tokens before storing them - we need to hash the input to compare
function hashToken(token) {
    return createHash("sha256")
        .update(`${token}${process.env.AUTH_SECRET}`)
        .digest("hex")
}

export async function POST(req) {
    try {
        const { email, code } = await req.json()

        if (!email || !code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Normalize the code and email (trim whitespace, lowercase email)
        const normalizedCode = code.trim()
        const normalizedEmail = email.trim().toLowerCase()

        // Hash the code the same way NextAuth does
        const hashedCode = hashToken(normalizedCode)

        console.log(`[verify-code] Checking token for email: "${normalizedEmail}", code: "${normalizedCode}", hashed: "${hashedCode}"`)

        // 1. Find the valid verification token in the database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: normalizedEmail,
                token: hashedCode,
            }
        })

        if (!verificationToken) {
            // Token doesn't exist at all
            console.log(`[verify-code] No token found for email: ${normalizedEmail} with hashed code`)
            return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 })
        }

        // Check if token has expired
        if (new Date() > verificationToken.expires) {
            console.log(`[verify-code] Token expired for email: ${normalizedEmail}. Expired at: ${verificationToken.expires}`)
            return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 })
        }

        // Token is valid
        console.log(`[verify-code] Valid token found for email: ${normalizedEmail}`)
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Verification error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
