/** @type {import('next').NextConfig} */
const nextConfig = {
    reactCompiler: true,
    // Transpile monaco-editor for proper bundling
    transpilePackages: ['monaco-editor'],
    // Configure webpack to handle pdf.js worker (used when building with webpack)
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
    // Turbopack configuration (Next.js 16+ uses Turbopack by default)
    // Empty config to acknowledge we're using turbopack intentionally
    turbopack: {},
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'img.icons8.com',
            },
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'secure.gravatar.com',
            }
        ],
    },
    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        // SECURITY NOTE: 'unsafe-inline' and 'unsafe-eval' are required for:
                        // - Monaco Editor functionality (unsafe-eval)
                        // - Some CSS-in-JS libraries (unsafe-inline for styles)
                        // - cdn.jsdelivr.net is required for Monaco Editor resources (JS, CSS, workers)
                        // Consider using nonces or hashes in the future for stricter CSP
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com blob:",
                            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                            "style-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                            "img-src 'self' data: blob: https://amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://gitlab.com https://secure.gravatar.com https://raw.githubusercontent.com",
                            "font-src 'self' data: https://cdn.jsdelivr.net",
                            "connect-src 'self' https://api.github.com https://gitlab.com https://*.amazonaws.com https://cdn.jsdelivr.net https://unpkg.com",
                            "worker-src 'self' blob:",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
