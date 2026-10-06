# ==============================================================================
# Momentra (HDAM) — Multi-Stage Production Dockerfile
# Optimized for Node.js 22 LTS, Security Hardening (Non-root), and Minimal Size
# ==============================================================================

# --- Stage 1: Base Image with System Dependencies ---
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init
ENV NODE_ENV=production

# --- Stage 2: Dependencies Installation ---
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# --- Stage 3: TypeScript Build ---
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
# Build TypeScript to dist/
RUN npm run build
# Prune devDependencies to reduce final image size
RUN npm prune --omit=dev

# --- Stage 4: Production Runner (Least Privilege) ---
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init curl
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create dedicated non-root user and group
RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 --ingroup nodejs appuser

# Copy application artifacts with correct ownership
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

USER appuser
EXPOSE 3000

# Container Healthcheck against Foundation /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/server.js"]
