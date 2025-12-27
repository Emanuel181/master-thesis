# ----------------------------
# Dependencies
# ----------------------------
FROM node:20.11-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------
# Builder
# ----------------------------
FROM node:20.11-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma client generation (no DB access required)
RUN npx prisma generate

# Build application
RUN npm run build

# Remove dev dependencies for runtime safety
RUN npm prune --omit=dev

# ----------------------------
# Runner
# ----------------------------
FROM node:20.11-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy runtime artifacts only
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pre-render cache permissions
RUN mkdir .next && chown nextjs:nodejs .next

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000 || exit 1

CMD ["node", "server.js"]
