import { NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from "@aws-sdk/client-polly";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders, readJsonBody } from "@/lib/api-security";

const pollyClient = new PollyClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

// Curated neural voices optimized for cybersecurity blog reading
// These voices are clear, professional, and easy to understand for technical content
const NEURAL_VOICES = [
    // US English - Most popular for tech content
    { id: 'Matthew', name: 'Matthew', accent: 'US', gender: 'Male', description: 'Clear, professional - great for technical content', language: 'en-US' },
    { id: 'Joanna', name: 'Joanna', accent: 'US', gender: 'Female', description: 'Warm, authoritative - excellent for tutorials', language: 'en-US' },
    { id: 'Stephen', name: 'Stephen', accent: 'US', gender: 'Male', description: 'Deep, confident - ideal for security advisories', language: 'en-US' },
    { id: 'Ruth', name: 'Ruth', accent: 'US', gender: 'Female', description: 'Calm, measured - perfect for longer articles', language: 'en-US' },
    { id: 'Gregory', name: 'Gregory', accent: 'US', gender: 'Male', description: 'Energetic, engaging - good for news updates', language: 'en-US' },
    
    // UK English - Professional British accent
    { id: 'Brian', name: 'Brian', accent: 'UK', gender: 'Male', description: 'British, authoritative - classic narrator style', language: 'en-GB' },
    { id: 'Amy', name: 'Amy', accent: 'UK', gender: 'Female', description: 'British, clear - professional and articulate', language: 'en-GB' },
    { id: 'Arthur', name: 'Arthur', accent: 'UK', gender: 'Male', description: 'British, distinguished - documentary style', language: 'en-GB' },
    
    // Australian English
    { id: 'Olivia', name: 'Olivia', accent: 'AU', gender: 'Female', description: 'Australian, friendly - approachable tone', language: 'en-AU' },
];

// GET - List available voices
export async function GET(request) {
    try {
        // Rate limiting - 30 requests per minute
        const rl = await rateLimit({
            key: `tts:voices`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: securityHeaders }
            );
        }

        return NextResponse.json({ voices: NEURAL_VOICES }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error fetching voices:", error);
        return NextResponse.json(
            { error: "Failed to fetch voices" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// POST - Synthesize speech from text
export async function POST(request) {
    try {
        // Optional auth - allow public access for blog articles but track usage
        const session = await auth();
        const userId = session?.user?.id || 'anonymous';

        // Rate limiting - more generous for authenticated users
        const limit = session?.user?.id ? 20 : 5; // 20 for authenticated, 5 for anonymous per minute
        const rl = await rateLimit({
            key: `tts:synthesize:${userId}`,
            limit,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429, headers: securityHeaders }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400, headers: securityHeaders }
            );
        }

        const { text, voiceId = 'Joanna', speed = 'medium' } = parsed.body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Clean and limit text (Polly has a 3000 character limit per request for neural voices)
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '. Code example omitted. ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/#{1,6}\s*/g, '')
            .replace(/[*_~]/g, '')
            .replace(/>\s*/g, '')
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .replace(/\.\s*\./g, '.')
            .trim();

        if (cleanText.length > 6000) {
            return NextResponse.json(
                { error: 'Text too long. Maximum 6000 characters.' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Validate voice ID
        const validVoice = NEURAL_VOICES.find(v => v.id === voiceId);
        if (!validVoice) {
            return NextResponse.json(
                { error: 'Invalid voice ID' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Map speed to SSML prosody rate
        const speedMap = {
            'slow': 'slow',
            'medium': 'medium',
            'fast': 'fast',
            'x-fast': 'x-fast'
        };
        const prosodyRate = speedMap[speed] || 'medium';

        // Wrap text in SSML for better control
        const ssmlText = `<speak><prosody rate="${prosodyRate}">${escapeXml(cleanText)}</prosody></speak>`;

        // For longer texts, we need to chunk them (Polly neural limit is 3000 chars)
        const chunks = chunkText(cleanText, 2800);
        const audioChunks = [];

        for (const chunk of chunks) {
            const ssmlChunk = `<speak><prosody rate="${prosodyRate}">${escapeXml(chunk)}</prosody></speak>`;
            
            const command = new SynthesizeSpeechCommand({
                Engine: 'neural',
                OutputFormat: 'mp3',
                Text: ssmlChunk,
                TextType: 'ssml',
                VoiceId: voiceId,
            });

            const response = await pollyClient.send(command);
            
            if (response.AudioStream) {
                const audioBuffer = await streamToBuffer(response.AudioStream);
                audioChunks.push(audioBuffer);
            }
        }

        // Combine all audio chunks
        const combinedAudio = Buffer.concat(audioChunks);
        const base64Audio = combinedAudio.toString('base64');

        return NextResponse.json({
            audio: base64Audio,
            contentType: 'audio/mpeg',
            voiceId,
            charactersProcessed: cleanText.length
        }, { headers: securityHeaders });

    } catch (error) {
        console.error("Error synthesizing speech:", error);
        
        // Check for specific AWS errors
        if (error.name === 'TextLengthExceededException') {
            return NextResponse.json(
                { error: 'Text is too long for synthesis' },
                { status: 400, headers: securityHeaders }
            );
        }
        
        return NextResponse.json(
            { error: "Failed to synthesize speech" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// Helper: Escape XML special characters for SSML
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Helper: Convert stream to buffer
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// Helper: Chunk text into smaller pieces for Polly
function chunkText(text, maxLength) {
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            // If single sentence is too long, split by words
            if (sentence.length > maxLength) {
                const words = sentence.split(' ');
                currentChunk = '';
                for (const word of words) {
                    if ((currentChunk + ' ' + word).length > maxLength) {
                        chunks.push(currentChunk.trim());
                        currentChunk = word;
                    } else {
                        currentChunk += ' ' + word;
                    }
                }
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += sentence;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
}
