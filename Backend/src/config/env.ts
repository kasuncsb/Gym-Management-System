import { z } from 'zod';
import 'dotenv/config';

/**
 * Strict environment validation — NO defaults anywhere.
 * Every variable MUST be set in the .env file.
 * The server exits at startup if any required variable is missing or invalid.
 */
const envSchema = z.object({
  // Database
  DB_HOST:     z.string().min(1),
  DB_PORT:     z.coerce.number().int().positive(),
  DB_USER:     z.string().min(1),
  DB_PASSWORD: z.string(),               // allow empty password in dev if needed
  DB_NAME:     z.string().min(1),

  // Server
  PORT:     z.coerce.number().int().positive(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // JWT — min 32 chars
  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Frontend URL (used for CORS and email links)
  FRONTEND_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Email (SMTP)
  SMTP_HOST:     z.string().min(1),
  SMTP_PORT:     z.coerce.number().int().positive(),
  SMTP_USER:     z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  EMAIL_FROM:    z.string().min(1),

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
  console.error('❌  Missing or invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  console.error('\nAll variables must be set in the .env file. Exiting.');
  process.exit(1);
}

export const env = parsed.data;
