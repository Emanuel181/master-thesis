import { requireProductionMode } from "@/lib/api-middleware";
import { z } from "zod";
import { isSameOrigin, readJsonBody, getClientIp } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";
import { 
    successResponse, 
    errorResponse, 
    generateRequestId 
} from "@/lib/api-handler";

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
    const requestId = generateRequestId();
    
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    
    try {
        // CSRF protection
        if (!isSameOrigin(request)) {
            return errorResponse('Forbidden', { status: 403, code: 'FORBIDDEN', requestId });
        }

        // Rate limiting - 5 subscription attempts per hour per IP (using consistent extraction)
        const clientIp = getClientIp(request);
        const rl = await rateLimit({
            key: `subscribe:${clientIp}`,
            limit: 5,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return errorResponse('Too many subscription attempts. Please try again later.', {
                status: 429,
                code: 'RATE_LIMITED',
                requestId,
                headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
            });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return errorResponse('Invalid JSON body', { status: 400, code: 'INVALID_JSON', requestId });
        }

        const validation = subscribeSchema.safeParse(parsed.body);
        if (!validation.success) {
            return errorResponse('Please provide a valid email address', { status: 400, code: 'VALIDATION_ERROR', requestId });
        }

        const { email } = validation.data;

        const BREVO_API_KEY = process.env.BREVO_API_KEY;

        if (!BREVO_API_KEY) {
            console.error("BREVO_API_KEY is not configured");
            return errorResponse('Subscription service is not configured', { status: 500, code: 'CONFIG_ERROR', requestId });
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
            return successResponse({ message: 'Successfully subscribed!' }, { requestId });
        }

        // Handle already existing contact (which is fine)
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.code === "duplicate_parameter") {
                return successResponse({ message: "You're already subscribed!" }, { requestId });
            }
            return errorResponse('Failed to subscribe', { status: 400, code: 'SUBSCRIBE_FAILED', requestId });
        }

        return errorResponse('Failed to subscribe. Please try again later.', { status: 502, code: 'UPSTREAM_ERROR', requestId });
    } catch (error) {
        // SECURITY: Don't log full error object, may contain sensitive data
        console.error("[subscribe] Error:", error?.message || 'Unknown error');
        return errorResponse('An error occurred. Please try again later.', { status: 500, code: 'INTERNAL_ERROR', requestId });
    }
}

