/**
 * Next.js Instrumentation
 * =======================
 *
 * This file runs once when the Next.js server starts.
 * Used for startup validation and initialization.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on the server (not edge runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { validateEnv } = await import('@/lib/env-validation');

        const result = validateEnv({ throwOnError: false });

        if (result.errors.length > 0) {
            console.error('╔══════════════════════════════════════════════════╗');
            console.error('║  ENVIRONMENT VALIDATION FAILED                   ║');
            console.error('╚══════════════════════════════════════════════════╝');
            result.errors.forEach(err => console.error(`  ✗ ${err}`));

            if (process.env.NODE_ENV === 'production') {
                console.error('\nFatal: Missing required environment variables in production.');
                process.exit(1);
            }
        }

        if (result.warnings.length > 0) {
            console.warn('[env] Warnings:');
            result.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
        }

        if (result.errors.length === 0) {
            console.log('[env] ✓ All required environment variables are set.');
        }
    }
}

