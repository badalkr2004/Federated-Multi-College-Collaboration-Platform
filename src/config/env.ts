import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Email (Resend) — optional in dev, logs instead
  RESEND_API_KEY: z.string().optional().default(''),
  ADMIN_EMAIL: z.string().email().default('admin@platform.ac.in'),

  // Super admin seeded credentials
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@platform.ac.in'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('SuperSecurePass123!'),

  // Tenant domain suffix: 'localhost' in dev, 'ac.in' in prod
  DOMAIN_SUFFIX: z.string().default('localhost'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
