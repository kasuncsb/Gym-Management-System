# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script and drizzle config for runtime migrations
COPY entrypoint.sh ./
COPY drizzle.config.ts ./
COPY src/db/schema.ts ./src/db/
# Seed script needs utils and config
COPY scripts/seed.ts ./scripts/
COPY src/config ./src/config/
COPY src/utils ./src/utils/

# Make entrypoint executable and ensure permissions
USER root
RUN chmod +x ./entrypoint.sh
USER appuser

EXPOSE 5000

# Healthcheck — docker-compose / orchestrator can restart if unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
