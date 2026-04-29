# AGENTS.md — AI Coding Agent Guide

Guide for AI agents working in the VulnIQ codebase (Next.js 15 + Prisma security analysis platform).

## Architecture Overview

**VulnIQ** is a security analysis platform where users submit code/PDFs for AI-driven vulnerability assessment. The platform integrates:

- **Frontend**: Next.js 15 app router (ISO locale support via `next-intl`)
- **Database**: PostgreSQL + Prisma 7 (connection pooling via `@prisma/adapter-pg`)
- **Auth**: NextAuth v5 with multi-provider OAuth + email/OTP (GitHub, Google, GitLab, Microsoft Entra)
- **Backend workflows**: AWS Step Functions for distributed security analysis agents
- **RAG system**: Bedrock knowledge base (RAG) for code review agents
- **File storage**: AWS S3 (PDFs, generated reports, user exports)
- **Real-time updates**: WebSocket integration for long-running workflows

## Key Concepts

### 1. API Handler Pattern (Critical)

All API routes use `createApiHandler()` wrapper in `lib/api-handler.js`. This provides:
- **Authentication check** (`requireAuth: true`)
- **Rate limiting** (user ID or IP-based)
- **CSRF protection** (origin validation for state-changing ops)
- **Body/query validation** (Zod schemas)
- **Standard response format** (success/error with requestId)

**Pattern**:
```javascript
import { createApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const bodySchema = z.object({ title: z.string() });

export const POST = createApiHandler(
  async (request, context) => {
    const { session, body, query, requestId } = context;
    return { article: { id: '123', title: body.title } };
  },
  {
    requireAuth: true,
    bodySchema,
    rateLimit: { limit: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'articles' },
  }
);
```

All routes in `app/api/**` follow this pattern — never write raw handlers.

### 2. Authentication & Session Management

**NextAuth config** (`auth.js`):
- **Adapter**: Custom PrismaAdapter with orphan account cleanup (handles cross-email account linking)
- **Session strategy**: JWT (stateless)
- **Providers**: GitHub (with `allowDangerousEmailAccountLinking`), Google, GitLab, Microsoft Entra, email/OTP
- **Security guard**: `signIn` callback blocks cross-email sign-in on initial login (prevents user confusion when linking secondary accounts)
- **JWT refresh**: Token is refreshed every 5 minutes to pick up profile changes

**Important**: Always use `allowDangerousEmailAccountLinking: true` for verified email providers (GitHub, Google, Microsoft, GitLab) — the adapter cleanup handles edge cases.

Get session in API: `const session = await auth();` → returns `{ user: { id, email, name, image }, provider }`

### 3. Prisma & Database

**Connection pooling** (`lib/prisma.js`):
- Uses `@prisma/adapter-pg` with custom `Pool` config
- Pool size: `DATABASE_POOL_MAX` (default 10)
- Idle timeout: 30s, connection timeout: 5s
- **Warmup on startup**: Prevents cold start errors

**Prisma client**: Use `export { default } from '/lib/prisma'` to import globally-cached instance.

**Schema patterns**:
- User has many PDFs, Prompts, Articles (cascading deletes)
- Per-user Bedrock data source (`User.bedrockDataSourceId`) for vector isolation
- Audit logs with GDPR-compliant IP anonymization (`AuditLog.ipAddress` is anonymized)
- Distributed circuit breaker state in `CircuitBreaker` table for shared infrastructure

### 4. AWS Orchestration

**AWS Step Functions** (`lib/aws-orchestrator.js`):
- Starts long-running security analysis workflows via `startSecurityRun()`
- Returns `executionArn` for polling status with `getRunStatus()`
- Input format: `{ runId, userId, groupIds }`
- Env vars: `AWS_STEP_FUNCTIONS_ARN`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Workflow integration** (`lib/start-analysis.js`):
- Fetches use cases by group ID
- **SECURITY**: Enforces RAG — at least one knowledge base PDF must be selected
- Sends to `/api/workflow/start` with documents, prompts, code
- Documents are strictly limited to what user selected (RAG boundary)

**Lambda deployment**: Infrastructure in `infrastructure/lambda/*` (Python 3.11 required to rebuild)

### 5. React Context System

**Settings Context** (`contexts/settingsContext.jsx`):
- Theme, editor style, syntax colors (client-side, localStorage-persisted)
- Exported config modules: `themePresets`, `editorThemes`, `syntaxColorPresets`
- Always check `mounted` state before rendering (SSR hydration safety)

Other contexts: `projectContext`, `promptsContext`, `recentlyViewedContext`, `settingsContext`, `accessibilityContext`, etc. — all `'use client'` components.

### 6. Client-Side Data Fetching

**useApiFetch hook** (`hooks/use-api-fetch.js`):
- Exponential backoff retry (3 attempts, 500ms base, configurable)
- Abort controller support
- Request deduplication
- Loading/error state management

Pattern:
```javascript
const { data, loading, error, invoke } = useApiFetch();
await invoke('/api/articles', { method: 'POST', body: { title: 'x' } });
```

### 7. Security Patterns

**API Security** (`lib/api-security.js`):
- `getClientIp(request)`: AWS ALB appends client IP to X-Forwarded-For (configurable via `PROXY_TYPE` env)
- `isSameOrigin(request)`: CSRF validation — requires origin ≈ host for browser requests
- `securityHeaders`: Strict cache control, XSS protection, CORP headers (defense-in-depth)

**Audit Logging** (`lib/audit-log.js`):
- GDPR-compliant: IP addresses anonymized (last octet zeroed for IPv4, last 80 bits for IPv6)
- User agents truncated to prevent fingerprinting
- Records `AuditLog.action` (LOGIN, API_CALL, etc.) with `resource` and `metadata`
- Fire-and-forget pattern (don't block request on audit failure)

**S3 Signing** (`lib/s3.js`):
- Pre-signed URLs for secure file uploads/downloads
- Uses `@aws-sdk/s3-request-presigner`

### 8. Common Workflows

**User signup**:
1. OAuth provider or email/OTP via NextAuth
2. PrismaAdapter creates User record
3. `createUser` event seeds default prompts (`lib/user-seeding.js`)
4. Session JWT issued with user.id

**Upload PDF for knowledge base**:
1. Client calls `POST /api/pdfs` with file + use case ID
2. Presigned S3 URL generated
3. Client uploads directly to S3
4. Webhook/API updates `Pdf.vectorized = false`, `embeddingStatus = pending`
5. Background job calls Bedrock to vectorize (`bedrock-datasource.js`)

**Start security analysis**:
1. User selects use cases + PDFs (enforced non-empty)
2. Frontend calls `/api/workflow/start`
3. Step Functions execution starts with `runId`
4. WebSocket connection opened for real-time updates
5. Agents analyze code using selected PDFs as RAG context

**Export user data** (GDPR):
1. Admin calls `/api/profile/export`
2. Fetches all user records (articles, PDFs, audit logs)
3. Generates ZIP, uploads to S3
4. Returns presigned download URL

### 9. Development Workflows

**Build & test**:
```powershell
npm install
npx prisma generate
npx prisma db push          # dev mode (not baselined)
# or: npx prisma migrate deploy   # production
npm run dev                 # Next.js on :3000 with Turbopack
npm run lint                # ESLint (generated Prisma ignored)
npm run test                # Node.js test runner
npm run build               # Standalone output (output: 'standalone')
```

**Database inspection**:
```bash
npx prisma studio         # Web UI at :5555
```

**Environment setup**:
- Copy `.env.example` to `.env`
- Required: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- Optional groups: OAuth providers, AWS keys, Bedrock KB ID, SES email, Turnstile

**Common pitfalls**:
- Never commit `.env` (tracked in `.gitignore` except `.env.example`)
- `NEXT_PUBLIC_*` vars are shipped to browser — no secrets
- CSP includes `unsafe-eval` for Monaco Editor (required, no eval in app code)
- Standalone build may fail on Windows with colons in filenames — build on Linux/Docker
- Web-tree-sitter needs fallback modules in webpack/turbopack config for browser bundles

### 10. File Organization

```
app/
  api/                # API routes (use createApiHandler)
    admin/, auth/, articles/, github/, workflow/, etc.
  [locale]/           # Localized pages (next-intl)
    layout.jsx
    page.jsx, dashboard/, editor/, profile/, etc.
  
components/           # React UI components
  ui/                 # Shadcn/Radix primitives
  editor/, dashboard/, login/, tiptap-ui/, etc.
  
contexts/             # React Context providers (use client)
  settingsContext, projectContext, etc.
  config/             # Extracted theme/editor config
  
hooks/                # React hooks
  use-api-fetch, use-keyboard-shortcuts, use-models-dialog, etc.
  
lib/
  api-handler.js      # Request wrapper (auth, validation, rate limit)
  api-security.js     # Security utilities
  prisma.js           # Cached Prisma client
  audit-log.js        # GDPR audit logging
  aws-orchestrator.js # Step Functions client
  start-analysis.js   # Workflow entry point
  generated/prisma/   # @prisma/client (generated, do not edit)
  
prisma/
  schema.prisma       # Database schema
  migrations/         # SQL migrations
  
infrastructure/
  terraform/          # IaC (AWS resources)
  lambda/             # Python agents source
  aws/cdk/            # CDK for advanced resources
  
public/               # Static assets
styles/               # Global CSS, Tailwind config
messages/             # next-intl translation files
```

### 11. Testing

**E2E tests** (`tests/e2e/`): Playwright with `baseURL: http://localhost:3000`
- Run: `npm run test` or `npx playwright test`
- Config: `playwright.config.js` (1 worker, no retries, Chrome only)

**Unit tests** (`lib/__tests__/`, `hooks/__tests__/`): Node.js built-in test runner
- Pattern: Files named `*.test.js` or in `__tests__/` folder
- Run: `npm run test`

## Common Agent Tasks

### Adding a new API endpoint
1. Create `app/api/[category]/route.js`
2. Use `createApiHandler()` with appropriate config
3. Define Zod body/query schemas
4. Add to audit log if state-modifying
5. Return `{ success: true, data: {...} }`

### Modifying the database schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name feature_name` (creates migration)
3. Or use `npx prisma db push` during development
4. Restart dev server (Prisma client regenerates)

### Adding a new page with localization
1. Create `app/[locale]/feature/page.jsx`
2. Import translations: `const t = useTranslations('feature');`
3. Use `t('key')` for all user-facing strings
4. Add translation keys to `messages/[locale]/common.json`

### Connecting to AWS Step Functions workflow
1. Use `startSecurityRun({ userId, groupIds })` from `aws-orchestrator.js`
2. Get back `{ runId, executionArn }`
3. Subscribe to updates: `createWebSocketConnection(runId)` with handlers
4. Poll status: `getRunStatus(executionArn)` for retry/fallback logic

### Handling long-running operations
1. Start async operation, return job ID immediately
2. Client subscribes to WebSocket or polls status endpoint
3. Use Step Functions execution status for state
4. Store intermediate results in `S3` or `database`
5. Final result returned via webhook or status endpoint

## References

- **Next.js docs**: https://nextjs.org/docs
- **Prisma docs**: https://www.prisma.io/docs
- **NextAuth.js v5**: https://authjs.dev
- **AWS SDK for JavaScript**: https://docs.aws.amazon.com/sdk-for-javascript
- **Zod validation**: https://zod.dev
- **Tailwind CSS**: https://tailwindcss.com
- **next-intl**: https://next-intl-docs.vercel.app

