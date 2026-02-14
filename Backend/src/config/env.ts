// Centralized environment configuration — validated at startup
import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`FATAL: Missing required env var ${key}`);
    }
    console.warn(`WARNING: Missing env var ${key}; using dev fallback`);
    return '';
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  // Server
  PORT: parseInt(optional('PORT', '5000'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3000'),

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // JWT — separate secrets for access & refresh
  JWT_ACCESS_SECRET: (() => {
    const s = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!s && process.env.NODE_ENV === 'production') throw new Error('FATAL: JWT_ACCESS_SECRET must be set');
    if (!s) {
      console.warn('WARNING: Using dev JWT_ACCESS_SECRET');
      return 'dev-access-secret-unsafe';
    }
    return s;
  })(),
  JWT_REFRESH_SECRET: (() => {
    const s = process.env.JWT_REFRESH_SECRET;
    if (!s && process.env.NODE_ENV === 'production') throw new Error('FATAL: JWT_REFRESH_SECRET must be set');
    if (!s) {
      console.warn('WARNING: Using dev JWT_REFRESH_SECRET');
      return 'dev-refresh-secret-unsafe';
    }
    return s;
  })(),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  // QR
  QR_SECRET: optional('QR_SECRET', 'dev-qr-secret-unsafe'),

  // Password
  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  // Email
  SMTP_HOST: optional('SMTP_HOST', 'smtp.zoho.com'),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '465'), 10),
  SMTP_SECURE: optional('SMTP_SECURE', 'true') === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: optional('EMAIL_FROM', '"PowerWorld Gyms" <noreply@powerworld.lk>'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:3000'),

  // Gym
  GYM_NAME: optional('GYM_NAME', 'PowerWorld Gyms'),
  GYM_LOCATION: optional('GYM_LOCATION', 'Kiribathgoda'),
  GYM_LOCATION_CODE: optional('GYM_LOCATION_CODE', 'KBT'),
  GYM_TIMEZONE: optional('GYM_TIMEZONE', 'Asia/Colombo'),

  // Rate limit
  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  QR_SCAN_RATE_LIMIT: parseInt(optional('QR_SCAN_RATE_LIMIT', '10'), 10),

  // Branch
  DEFAULT_BRANCH_ID: process.env.DEFAULT_BRANCH_ID || '',
} as const;

export default env;
