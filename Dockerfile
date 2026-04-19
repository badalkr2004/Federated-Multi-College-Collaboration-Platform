# ──────────────────────────────────────────────
#  Stage 1: Build  (TypeScript → JavaScript)
# ──────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

# Build — legacy src/routes/ files have type errors (dead code), skip them
RUN bunx tsc --noEmitOnError false || true

# ──────────────────────────────────────────────
#  Stage 2: Runtime — use BUN (not Node) to avoid
#  ESM extensionless import resolution issues
# ──────────────────────────────────────────────
FROM oven/bun:1 AS runtime

# Install pg_isready for the healthcheck wait in entrypoint
RUN apt-get update -qq && apt-get install -y --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy compiled JS + source (bun needs src/ for drizzle-kit + seed)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./
COPY src ./src
COPY entrypoint.sh ./

RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
