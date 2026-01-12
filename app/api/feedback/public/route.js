import { google } from 'googleapis';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { isSameOrigin, readJsonBody, getClientIp } from '@/lib/api-security';
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse,
    generateRequestId 
} from '@/lib/api-handler';

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

export async function POST(request) {
    const requestId = generateRequestId();
    
    try {
        // Get client IP for rate limiting using consistent extraction
        const clientIp = getClientIp(request);

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return errorResponse('Forbidden', { status: 403, code: 'FORBIDDEN', requestId });
        }

        // Rate limiting - 3 feedback submissions per hour per IP
        const rl = await rateLimit({
            key: `public-feedback:${clientIp}`,
            limit: 3,
            windowMs: 60 * 60 * 1000 // 1 hour
        });
        if (!rl.allowed) {
            return errorResponse('Too many feedback submissions. Please try again later.', {
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

        // Validate input with Zod
        const validationResult = feedbackSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return validationErrorResponse(validationResult.error, { requestId });
        }

        const { feedback, email, page } = validationResult.data;

        const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID;
        if (!spreadsheetId) {
            console.error('[public-feedback] FEEDBACK_SPREADSHEET_ID is not set');
            return errorResponse('Server configuration error', { status: 500, code: 'CONFIG_ERROR', requestId });
        }

        const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!rawCreds) {
            console.error('[public-feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not set');
            return errorResponse('Server configuration error', { status: 500, code: 'CONFIG_ERROR', requestId });
        }

        let credentials;
        try {
            credentials = JSON.parse(rawCreds);
        } catch {
            console.error('[public-feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
            return errorResponse('Server configuration error', { status: 500, code: 'CONFIG_ERROR', requestId });
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

        return successResponse({ message: 'Feedback submitted successfully' }, { requestId });
    } catch (error) {
        console.error('[public-feedback] Error submitting feedback:', error);
        return errorResponse('Internal server error', { status: 500, code: 'INTERNAL_ERROR', requestId });
    }
}
