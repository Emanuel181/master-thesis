import { google } from 'googleapis';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { isSameOrigin, readJsonBody, securityHeaders } from '@/lib/api-security';

// Input validation schema for public feedback
const feedbackSchema = z.object({
    feedback: z.string()
        .min(1, 'Feedback is required')
        .max(5000, 'Feedback must be less than 5000 characters')
        .transform(val => val.trim()),
    email: z.string()
        .email('Invalid email address')
        .optional()
        .transform(val => val?.trim() || 'anonymous'),
    page: z.string()
        .max(200, 'Page URL too long')
        .optional()
        .default('landing')
});

function formatZodErrors(zodError) {
    const fieldErrors = {};
    for (const issue of zodError.issues || []) {
        const key = issue.path?.[0] ? String(issue.path[0]) : 'form';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
    }
    return fieldErrors;
}

export async function POST(request) {
    try {
        // Get client IP for rate limiting (no auth required for public feedback)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        // Rate limiting - 3 feedback submissions per hour per IP
        const rl = await rateLimit({
            key: `public-feedback:${clientIp}`,
            limit: 3,
            windowMs: 60 * 60 * 1000 // 1 hour
        });
        if (!rl.allowed) {
            return new Response(JSON.stringify({
                error: 'Too many feedback submissions. Please try again later.',
                retryAt: rl.resetAt
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        // Validate input with Zod
        const validationResult = feedbackSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                fieldErrors: formatZodErrors(validationResult.error)
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        const { feedback, email, page } = validationResult.data;

        const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID;
        if (!spreadsheetId) {
            console.error('[public-feedback] FEEDBACK_SPREADSHEET_ID is not set');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!rawCreds) {
            console.error('[public-feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not set');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        let credentials;
        try {
            credentials = JSON.parse(rawCreds);
        } catch {
            console.error('[public-feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...securityHeaders }
            });
        }

        // Google Sheets API setup
        const authGoogle = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth: authGoogle });
        const range = 'A:D';

        // Include source page in feedback submission
        const values = [[new Date().toISOString(), email, page, feedback]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values },
        });

        return new Response(JSON.stringify({ message: 'Feedback submitted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...securityHeaders }
        });
    } catch (error) {
        console.error('[public-feedback] Error submitting feedback:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...securityHeaders }
        });
    }
}
