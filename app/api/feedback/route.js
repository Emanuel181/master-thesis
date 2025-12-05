import { google } from 'googleapis';

export async function POST(request) {
    try {
        const { feedback } = await request.json();

        if (!feedback || feedback.trim() === '') {
            return new Response(JSON.stringify({ error: 'Feedback is required' }), { status: 400 });
        }

        // Google Sheets API setup
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1b8xBOC5VRwxsqM93utVF1HcqY97XmGbC8aCYqv1JRuE';
        const range = 'A:B';

        const values = [[new Date().toISOString(), feedback.trim()]];

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
