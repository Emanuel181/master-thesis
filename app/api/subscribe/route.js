import { NextResponse } from "next/server";
import { requireProductionMode } from "@/lib/api-middleware";
import { z } from "zod";
import { securityHeaders, isSameOrigin, readJsonBody } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";

// SECURITY: Hardcode Brevo API URL to prevent SSRF via environment variable manipulation
// NEVER use NEXT_PUBLIC_* env vars for server-side API endpoints
const BREVO_API_URL = "https://api.brevo.com/v3/contacts";

// Email validation schema
const subscribeSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(254, 'Email too long')
        .transform(v => v.toLowerCase().trim()),
}).strict();

export async function POST(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };
    
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
    try {
        // CSRF protection
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden', requestId },
                { status: 403, headers }
            );
        }

        // Rate limiting - 5 subscription attempts per hour per IP
        const clientIp = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
        const rl = await rateLimit({
            key: `subscribe:${clientIp}`,
            limit: 5,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many subscription attempts. Please try again later.', retryAt: rl.resetAt, requestId },
                { status: 429, headers }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: "Invalid JSON body", requestId },
                { status: 400, headers }
            );
        }

        const validation = subscribeSchema.safeParse(parsed.body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Please provide a valid email address", requestId },
                { status: 400, headers }
            );
        }

        const { email } = validation.data;

        const BREVO_API_KEY = process.env.BREVO_API_KEY;

        if (!BREVO_API_KEY) {
            console.error("BREVO_API_KEY is not configured");
            return NextResponse.json(
                { error: "Subscription service is not configured", requestId },
                { status: 500, headers }
            );
        }

        // Add contact to Brevo - using hardcoded URL to prevent SSRF
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
                email: email,
                updateEnabled: true,
                attributes: {
                    SOURCE: "VulnIQ Landing Page",
                    SUBSCRIBED_DATE: new Date().toISOString(),
                },
            }),
        });

        if (response.ok) {
            return NextResponse.json(
                { message: "Successfully subscribed!", requestId },
                { status: 200, headers }
            );
        }

        // Handle already existing contact (which is fine)
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.code === "duplicate_parameter") {
                return NextResponse.json(
                    { message: "You're already subscribed!", requestId },
                    { status: 200, headers }
                );
            }
            return NextResponse.json(
                { error: "Failed to subscribe", requestId },
                { status: 400, headers }
            );
        }

        return NextResponse.json(
            { error: "Failed to subscribe. Please try again later.", requestId },
            { status: 502, headers }
        );
    } catch (error) {
        // SECURITY: Don't log full error object, may contain sensitive data
        console.error("[subscribe] Error:", error?.message || 'Unknown error');
        return NextResponse.json(
            { error: "An error occurred. Please try again later." },
            { status: 500, headers }
        );
    }
}

