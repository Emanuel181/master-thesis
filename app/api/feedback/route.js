import { google } from 'googleapis';
import { auth } from '@/auth';

export async function POST(request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { feedback } = await request.json();

        if (!feedback || feedback.trim() === '') {
            return new Response(JSON.stringify({ error: 'Feedback is required' }), { status: 400 });
        }

        // Google Sheets API setup
        const authGoogle = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth: authGoogle });
        const spreadsheetId = '1b8xBOC5VRwxsqM93utVF1HcqY97XmGbC8aCYqv1JRuE';
        const range = 'A:C';

        // Include user email in feedback submission
        const values = [[new Date().toISOString(), session.user.email || 'anonymous', feedback.trim()]];

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
