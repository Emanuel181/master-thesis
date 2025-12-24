/**
 * Environment variable validation
 * Validates required environment variables at startup to fail fast
 */

const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
];

const optionalEnvVars = [
    // AWS (optional, but if one is set, all should be set)
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    // Google Sheets feedback integration (optional)
    'GOOGLE_SERVICE_ACCOUNT_KEY',
    'FEEDBACK_SPREADSHEET_ID',
    // OAuth providers (at least one should be set)
    'AUTH_GITHUB_ID',
    'AUTH_GITHUB_SECRET',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
    'AUTH_GITLAB_ID',
    'AUTH_GITLAB_SECRET',
    'AUTH_MICROSOFT_ENTRA_ID_ID',
    'AUTH_MICROSOFT_ENTRA_ID_SECRET',
];

const awsEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
];

const oauthProviders = [
    { id: 'AUTH_GITHUB_ID', secret: 'AUTH_GITHUB_SECRET' },
    { id: 'AUTH_GOOGLE_ID', secret: 'AUTH_GOOGLE_SECRET' },
    { id: 'AUTH_GITLAB_ID', secret: 'AUTH_GITLAB_SECRET' },
    { id: 'AUTH_MICROSOFT_ENTRA_ID_ID', secret: 'AUTH_MICROSOFT_ENTRA_ID_SECRET' },
];

/**
 * Validate environment variables
 * @param {Object} options - Validation options
 * @param {boolean} options.throwOnError - Whether to throw on error (default: true in production)
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateEnv(options = {}) {
    const { throwOnError = process.env.NODE_ENV === 'production' } = options;
    const errors = [];
    const warnings = [];

    // Check required env vars
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            errors.push(`Missing required environment variable: ${envVar}`);
        }
    }

    // Check AWS configuration (if any AWS var is set, all should be set)
    const awsVarsSet = awsEnvVars.filter(v => process.env[v]);
    if (awsVarsSet.length > 0 && awsVarsSet.length < awsEnvVars.length) {
        const missing = awsEnvVars.filter(v => !process.env[v]);
        warnings.push(`Partial AWS configuration detected. Missing: ${missing.join(', ')}`);
    }

    // Check OAuth providers (at least one should be fully configured)
    const configuredProviders = oauthProviders.filter(
        p => process.env[p.id] && process.env[p.secret]
    );
    if (configuredProviders.length === 0) {
        warnings.push('No OAuth providers configured. Users will not be able to sign in.');
    }

    // Check for incomplete OAuth provider configuration
    for (const provider of oauthProviders) {
        const hasId = Boolean(process.env[provider.id]);
        const hasSecret = Boolean(process.env[provider.secret]);
        if (hasId !== hasSecret) {
            const missing = hasId ? provider.secret : provider.id;
            warnings.push(`Incomplete OAuth provider configuration: ${missing} is missing`);
        }
    }

    // Validate DATABASE_URL format (basic check)
    if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
            warnings.push('DATABASE_URL does not appear to be a PostgreSQL connection string');
        }
    }

    // Validate AUTH_SECRET length
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
        warnings.push('AUTH_SECRET should be at least 32 characters for security');
    }

    // Google feedback config consistency
    const hasFeedbackSheetId = Boolean(process.env.FEEDBACK_SPREADSHEET_ID);
    const hasGoogleServiceAccountKey = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    if (hasFeedbackSheetId !== hasGoogleServiceAccountKey) {
        warnings.push('Incomplete feedback configuration: FEEDBACK_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_KEY must be set together');
    }
    if (hasGoogleServiceAccountKey) {
        try {
            JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch {
            errors.push('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
        }
    }

    const result = {
        valid: errors.length === 0,
        errors,
        warnings,
    };

    // Log warnings in development
    if (process.env.NODE_ENV === 'development') {
        for (const warning of warnings) {
            console.warn(`[env] Warning: ${warning}`);
        }
    }

    // Throw or log errors
    if (errors.length > 0) {
        const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
        if (throwOnError) {
            throw new Error(errorMessage);
        } else {
            console.error(`[env] ${errorMessage}`);
        }
    }

    return result;
}

/**
 * Get environment info (safe to expose, no secrets)
 * @returns {Object} Environment information
 */
export function getEnvInfo() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasDatabase: Boolean(process.env.DATABASE_URL),
        hasAws: Boolean(process.env.AWS_ACCESS_KEY_ID),
        hasGithubOAuth: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
        hasGoogleOAuth: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
        hasGitlabOAuth: Boolean(process.env.AUTH_GITLAB_ID && process.env.AUTH_GITLAB_SECRET),
        hasMicrosoftOAuth: Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET),
        hasFeedbackIntegration: Boolean(process.env.FEEDBACK_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    };
}

export default { validateEnv, getEnvInfo };

