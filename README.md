# VulnIQ (master-thesis)

Next.js 15 + Prisma + AWS-backed security analysis platform.

## Prerequisites

- Node.js 20+ (recommended 22+)
- PostgreSQL 14+ (reachable via `DATABASE_URL`)
- Python 3.11 (only needed if you plan to rebuild the Lambda agents in `infrastructure/lambda/*`)
- AWS credentials with access to Step Functions, S3 and Bedrock (optional for fully-featured runs)

## Environment variables

All runtime configuration lives in a single `.env` file at the repository root. A fully-documented template is provided in [`.env.example`](.env.example).

### 1. Create your local `.env`

PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

bash / zsh:

```bash
cp .env.example .env
$EDITOR .env
```

> `.env*` is ignored by git (see `.gitignore`) with an explicit `!.env.example` exception, so the template is tracked but your real `.env` never is.

### 2. Fill in the required values

At minimum you must set:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma |
| `AUTH_SECRET` (and `NEXTAUTH_SECRET`) | Session encryption key. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` | Base URL of the running app, e.g. `http://localhost:3000` |

Optional groups — enable only what you need:

- **OAuth providers**: `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `AUTH_GITLAB_*`, `AUTH_MICROSOFT_ENTRA_ID_*`
- **AWS core**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AGENT_ARTIFACTS_BUCKET`
- **Step Functions / agents**: `AWS_STEP_FUNCTIONS_ARN`, `WORKFLOW_AGENT_HMAC_SECRET`
- **Bedrock RAG**: `BEDROCK_KNOWLEDGE_BASE_ID`, `BEDROCK_DATA_SOURCE_ID`
- **Email**: `SES_FROM_EMAIL`, `BREVO_API_KEY`
- **Bot protection**: `TURNSTILE_SECRET_KEY` (set `SKIP_TURNSTILE=true` to bypass in local dev)
- **Admin panel**: `ADMIN_EMAILS`, `WEBAUTHN_RP_ID`

See `.env.example` for the full annotated list.

### 3. Initialise the database and run

```powershell
npm install
npx prisma generate
npx prisma migrate deploy   # production / CI
# - or - during development when migrations are not yet baselined:
npx prisma db push
npm run dev
```

### 4. Safety checklist

- Never commit `.env`.
- In production, prefer IAM roles over static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
- Anything prefixed `NEXT_PUBLIC_` is shipped to the browser — do **not** put secrets there.
- Rotate `AUTH_SECRET`, `WORKFLOW_AGENT_HMAC_SECRET`, `CRON_SECRET` and `CLEANUP_API_SECRET` periodically.

## Common scripts

```powershell
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Production build
npm run start        # Run the built app
npx prisma studio    # Inspect the database in a browser
```

## Project layout (high-level)

- `app/` — Next.js app router (pages, API routes)
- `components/` — React UI
- `lib/` — server-side utilities (Prisma client, AWS SDK helpers, auth, etc.)
- `prisma/` — schema and SQL migrations
- `infrastructure/` — Terraform and Lambda source for the AWS agents
- `scripts/` — operational / maintenance scripts

