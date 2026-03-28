/**
 * Rate limiting — prevents abuse and avoids 429 lockouts for normal SPA usage.
 * - General API: generous limit so navigation + profile + refresh don't trigger 429.
 * - Login: stricter limit per IP to reduce brute-force risk.
 * - AI chat: per-user per minute (align with `ai_chat_rate_limit_per_minute` config; env override).
 */
import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import type { AuthRequest } from './auth.js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** General API: 500 requests per 15 min per IP. Normal SPA use stays well below this. */
export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 500,
  // Simulator pages poll frequently in dev/prod; don't let that create 429 storms.
  // These endpoints are already scoped to the in-memory OTP store and return no secrets.
  skip: (req) => {
    const p = req.path || '';
    // Note: this middleware is mounted at /api/*, so req.path is the path after that mount.
    return p.startsWith('/ops/simulate/public/');
  },
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please wait a few minutes and try again.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Login only: 20 attempts per 15 min per IP to slow down brute force. */
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiChatPerMinute = Math.max(1, Math.min(120, Number(process.env.AI_CHAT_RATE_LIMIT_PER_MINUTE) || 20));

/** Per authenticated user; mount after `authenticate` on AI chat routes. */
export const aiChatUserRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: aiChatPerMinute,
  keyGenerator: (req: Request) => {
    const u = (req as AuthRequest).user;
    return u?.id ?? req.ip ?? 'anon';
  },
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many AI chat messages. Please wait a minute and try again.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
