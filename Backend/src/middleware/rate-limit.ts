/**
 * Rate limiting — prevents abuse and avoids 429 lockouts for normal SPA usage.
 * - General API: generous limit so navigation + profile + refresh don't trigger 429.
 * - Login: stricter limit per IP to reduce brute-force risk.
 */
import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** General API: 500 requests per 15 min per IP. Normal SPA use stays well below this. */
export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 500,
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
