import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../utils/env";

// Create postgres connection for Neon
const connectionString = env.DATABASE_URL;

// For Neon, we need SSL mode
const client = postgres(connectionString, {
  ssl: "require",
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export const pool = client;
export type Database = typeof db;
