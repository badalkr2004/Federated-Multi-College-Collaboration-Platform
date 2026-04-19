# ──────────────────────────────────────────────
#  Stage 1: Build  (Next.js production build)
# ──────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Inject Docker env vars at build time for NEXT_PUBLIC_ vars
ARG NEXT_PUBLIC_API_BASE=http://localhost:8000
ARG NEXT_PUBLIC_COLLEGE_A_HOST=projects.a.localhost
ARG NEXT_PUBLIC_COLLEGE_B_HOST=projects.b.localhost
ARG NEXT_PUBLIC_COLLEGE_A_KEY=cc_live_collegea000000000000000000000000000
ARG NEXT_PUBLIC_COLLEGE_B_KEY=cc_live_collegeb000000000000000000000000000

ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_COLLEGE_A_HOST=$NEXT_PUBLIC_COLLEGE_A_HOST
ENV NEXT_PUBLIC_COLLEGE_B_HOST=$NEXT_PUBLIC_COLLEGE_B_HOST
ENV NEXT_PUBLIC_COLLEGE_A_KEY=$NEXT_PUBLIC_COLLEGE_A_KEY
ENV NEXT_PUBLIC_COLLEGE_B_KEY=$NEXT_PUBLIC_COLLEGE_B_KEY

RUN bun run build

# ──────────────────────────────────────────────
#  Stage 2: Runtime
# ──────────────────────────────────────────────
FROM oven/bun:1 AS runtime

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["bun", "run", "start"]
