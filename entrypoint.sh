#!/usr/bin/env sh
set -e

echo "⏳  Waiting for PostgreSQL to be ready..."
until pg_isready -h "${PGHOST:-postgres}" -p 5432 -U "${PGUSER:-onecoll}" -d "${PGDATABASE:-onecolldb}" -q; do
  sleep 1
done
echo "✅  PostgreSQL is ready."

echo "🔄  Pushing schema (drizzle-kit push)..."
bun run db:push

echo "🌱  Seeding database..."
bun run db:seed

echo "🚀  Starting API server on port ${PORT:-8000}..."
# Use bun instead of node to avoid ESM extensionless import issues
exec bun run dist/index.js
