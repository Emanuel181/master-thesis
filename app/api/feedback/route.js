/**
 * Feedback API Route
 * ===================
 * 
 * POST - Submit feedback (authenticated users)
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { createApiHandler, errorResponse } from '@/lib/api-handler';

/**
 * Feedback schema
 */
const feedbackSchema = z.object({
    feedback: z.string()
        .min(1, 'Feedback is required')
        .max(5000, 'Feedback must be less than 5000 characters')
        .transform(val => val.trim()),
});

/**
 * POST /api/feedback
 * Submit feedback (authenticated users)
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { feedback } = body;

        const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID;
        if (!spreadsheetId) {
            console.error('[feedback] FEEDBACK_SPREADSHEET_ID is not set');
            return errorResponse('Server configuration error', {
                status: 500,
                code: 'CONFIG_ERROR',
                requestId,
            });
        }

        const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!rawCreds) {
            console.error('[feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not set');
            return errorResponse('Server configuration error', {
                status: 500,
                code: 'CONFIG_ERROR',
                requestId,
            });
        }

        let credentials;
        try {
            credentials = JSON.parse(rawCreds);
        } catch {
            console.error('[feedback] GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
            return errorResponse('Server configuration error', {
                status: 500,
                code: 'CONFIG_ERROR',
                requestId,
            });
        }

        // Google Sheets API setup
        const authGoogle = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth: authGoogle });
        const range = 'A:C';

        // Include user email in feedback submission
        const values = [[new Date().toISOString(), session.user.email || 'anonymous', feedback]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values },
        });

        return { message: 'Feedback submitted successfully' };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: feedbackSchema,
        rateLimit: {
            limit: 5,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'feedback',
        },
    }
);
