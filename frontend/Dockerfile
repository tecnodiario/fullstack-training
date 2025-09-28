# --- Build stage -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Disabilita telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# Installa dipendenze (usa package-lock o pnpm-lock/yarn.lock se li hai)
COPY package.json package-lock.json* ./
RUN npm ci

# Copia sorgenti e build
COPY . .
RUN npm run build

# --- Runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copia l'output standalone + assets statici
# (Next genera .next/standalone con server.js e node_modules minimi)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Utente non-root
RUN adduser -D nextjs
USER nextjs

EXPOSE 3000
# Avvia il server Next standalone
CMD ["node", "server.js"]
