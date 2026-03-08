# ── Stage 1: Install deps and build ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Build requires BACKEND_URL at build time for next.config.ts validation
# It is passed as a build arg and set as an env var during the build step
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output (if output: 'standalone' used) or full .next
COPY --from=builder /app/public        ./public
COPY --from=builder /app/.next         ./.next
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json

USER root
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh ./
RUN apk add --no-cache nginx && \
    chmod +x ./entrypoint.sh && \
    mkdir -p /var/log/nginx /var/lib/nginx && \
    chown -R appuser:appgroup /var/log/nginx /var/lib/nginx /etc/nginx

USER appuser

EXPOSE 3000
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]
