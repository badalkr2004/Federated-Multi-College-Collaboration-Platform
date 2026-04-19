import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000").transform(Number),
  API_URL: z.string().url().default("http://localhost:8000"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),

  // OAuth - Google (optional in dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // OAuth - GitHub (optional in dev)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional().default("noreply@example.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
