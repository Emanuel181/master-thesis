# ----------------------------
# Dependencies
# ----------------------------
FROM node:24-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------
# Builder (Next.js)
# ----------------------------
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time argument for Prisma client generation
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost:5432/db"}

COPY prisma ./prisma
COPY prisma.config.ts ./
# Prisma client generation (NO DB required)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# ----------------------------
# MIGRATION IMAGE (IMPORTANT)
# ----------------------------
FROM node:24-alpine AS migrate
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Prisma needs full schema + migrations
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Dummy DATABASE_URL for prisma generate (real one injected at runtime)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# Create migration script that handles failed migrations
RUN echo '#!/bin/sh' > /app/migrate.sh && \
    echo 'set -e' >> /app/migrate.sh && \
    echo '# Mark any failed migrations as rolled back' >> /app/migrate.sh && \
    echo 'npx prisma migrate resolve --rolled-back 20260103000000_add_article_content_s3_key 2>/dev/null || true' >> /app/migrate.sh && \
    echo '# Deploy migrations' >> /app/migrate.sh && \
    echo 'npx prisma migrate deploy' >> /app/migrate.sh && \
    chmod +x /app/migrate.sh

# DATABASE_URL is injected at runtime by ECS
CMD ["/bin/sh", "/app/migrate.sh"]

# ----------------------------
# Runner (App)
# ----------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p .next && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
