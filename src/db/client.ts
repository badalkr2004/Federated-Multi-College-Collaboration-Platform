import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import { env } from '../config/env.js';

// SSL is required for Neon (cloud) but must be disabled for local Docker postgres.
// Set PGSSLMODE=disable in docker-compose env to toggle.
const sslMode = process.env.PGSSLMODE === 'disable' ? false : ('prefer' as const);

const client = postgres(env.DATABASE_URL, {
  ssl: sslMode,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
