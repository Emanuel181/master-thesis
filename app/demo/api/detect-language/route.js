import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';
import { getDemoModeUserId } from '@/lib/demo-mode';

// Extension to language mapping
const EXTENSION_LANGUAGE_MAP = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    java: 'java',
    php: 'php',
    go: 'go',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    rs: 'rust',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    ps1: 'powershell',
};

// Supported languages for security analysis
const SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'c',
    'cpp',
    'php',
    'go',
    'rust',
    'json',
];

/**
 * Detect programming language from filename and/or content
 */
function detectLanguage(filename, content) {
    let detectedLanguage = null;

    // 1. Try to detect from file extension
    if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext && EXTENSION_LANGUAGE_MAP[ext]) {
            detectedLanguage = EXTENSION_LANGUAGE_MAP[ext];
        }
    }

    // 2. Try to detect from content if no extension match
    if (!detectedLanguage && content) {
        // Check shebangs
        if (/^#!\/.+\bpython/.test(content)) {
            detectedLanguage = 'python';
        } else if (/^#!\/.+\b(node|deno)/.test(content)) {
            detectedLanguage = 'javascript';
        } else if (/^#!\/.+\b(bash|sh|zsh)/.test(content)) {
            detectedLanguage = 'shell';
        }
        // Check common patterns
        else if (/\bpublic\s+static\s+void\s+main\s*\(/.test(content)) {
            detectedLanguage = 'java';
        } else if (/\bimport\s+React\b/.test(content) || /\bfrom\s+['"]react['"]/.test(content)) {
            detectedLanguage = 'javascript';
        } else if (/\bdef\s+\w+\s*\(.*\)\s*:/.test(content) || /\bimport\s+\w+/.test(content) && content.includes(':')) {
            detectedLanguage = 'python';
        } else if (/\bpackage\s+main\b/.test(content) && /\bfunc\s+/.test(content)) {
            detectedLanguage = 'go';
        } else if (/\bfn\s+main\s*\(\s*\)/.test(content) || /\blet\s+mut\b/.test(content)) {
            detectedLanguage = 'rust';
        } else if (/\bnamespace\s+\w+/.test(content) && /\bclass\s+\w+/.test(content)) {
            detectedLanguage = 'csharp';
        } else if (/\b<\?php\b/.test(content)) {
            detectedLanguage = 'php';
        } else if (/^#include\s+[<"]/.test(content)) {
            detectedLanguage = content.includes('iostream') || content.includes('std::') ? 'cpp' : 'c';
        }
    }

    // Check if the detected language is supported for security analysis
    const isSupported = detectedLanguage ? SUPPORTED_LANGUAGES.includes(detectedLanguage) : false;

    return {
        language: detectedLanguage,
        isSupported,
        supportedLanguages: SUPPORTED_LANGUAGES,
    };
}

export async function POST(request) {
    try {
        // STRICT DEMO MODE LOGIC
        // No auth check required
        const userId = getDemoModeUserId(request);

        // Rate limiting - 100 requests per minute (uses demo namespace)
        const rl = await rateLimit({
            key: `detect-language:${userId}`,
            limit: 100,
            windowMs: 60 * 1000,
            env: 'demo'
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const { filename, content } = await request.json();

        if (!filename && !content) {
            return NextResponse.json(
                { error: 'Either filename or content is required' },
                { status: 400, headers: securityHeaders }
            );
        }

        // SECURITY: Validate input types and sizes
        if (filename && (typeof filename !== 'string' || filename.length > 500)) {
            return NextResponse.json(
                { error: 'Invalid filename' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Limit content size for language detection - only need first 10KB
        const MAX_CONTENT_SIZE = 10 * 1024; // 10KB
        const truncatedContent = content && typeof content === 'string'
            ? content.slice(0, MAX_CONTENT_SIZE)
            : undefined;

        const result = detectLanguage(filename, truncatedContent);

        return NextResponse.json(result, { headers: securityHeaders });
    } catch (error) {
        console.error('[detect-language] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}