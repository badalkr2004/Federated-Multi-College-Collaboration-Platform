import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../utils/env";

// SSL is required for Neon (cloud) but must be disabled for local Docker postgres.
// Set PGSSLMODE=disable in docker-compose to toggle.
const sslMode = process.env.PGSSLMODE === "disable" ? false : ("require" as const);

const client = postgres(env.DATABASE_URL, {
  ssl: sslMode,
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const pool = client;
export type Database = typeof db;
