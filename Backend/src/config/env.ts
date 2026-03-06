import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Database
  DB_HOST:     z.string().default('localhost'),
  DB_PORT:     z.coerce.number().default(3306),
  DB_USER:     z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME:     z.string().default('gym_management'),

  // Server
  PORT:     z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  // JWT — required, no defaults
  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Frontend (used for CORS and email links)
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Redis — required
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Email (SMTP)
  SMTP_HOST:     z.string().optional(),
  SMTP_PORT:     z.coerce.number().optional().default(587),
  SMTP_USER:     z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM:    z.string().optional().default('noreply@powerworldgyms.lk'),

  // Oracle Cloud Infrastructure — Object Storage
  OCI_NAMESPACE:   z.string().min(1),
  OCI_BUCKET:      z.string().min(1),
  OCI_REGION:      z.string().min(1),
  OCI_TENANCY_ID:  z.string().min(1),
  OCI_USER_ID:     z.string().min(1),
  OCI_FINGERPRINT: z.string().min(1),
  OCI_PRIVATE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
