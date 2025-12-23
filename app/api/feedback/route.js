import { google } from 'googleapis';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// Input validation schema - limit feedback length to prevent abuse
const feedbackSchema = z.object({
    feedback: z.string()
        .min(1, 'Feedback is required')
        .max(5000, 'Feedback must be less than 5000 characters')
        .transform(val => val.trim())
});

export async function POST(request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Rate limiting - 5 feedback submissions per hour
        const rl = rateLimit({
            key: `feedback:${session.user.id}`,
            limit: 5,
            windowMs: 60 * 60 * 1000 // 1 hour
        });
        if (!rl.allowed) {
            return new Response(JSON.stringify({
                error: 'Too many feedback submissions. Please try again later.',
                retryAt: rl.resetAt
            }), { status: 429 });
        }

        const body = await request.json();

        // Validate input with Zod
        const validationResult = feedbackSchema.safeParse(body);
        if (!validationResult.success) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: validationResult.error.errors
            }), { status: 400 });
        }

        const { feedback } = validationResult.data;

        // Google Sheets API setup
        const authGoogle = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth: authGoogle });
        const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID;

        if (!spreadsheetId) {
            console.error('FEEDBACK_SPREADSHEET_ID environment variable is not set');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
        }

        const range = 'A:C';

        // Include user email in feedback submission
        const values = [[new Date().toISOString(), session.user.email || 'anonymous', feedback]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values },
        });

        return new Response(JSON.stringify({ message: 'Feedback submitted successfully' }), { status: 200 });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
