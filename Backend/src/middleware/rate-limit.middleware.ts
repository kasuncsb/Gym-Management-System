// Rate limiting middleware
import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/error-types';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

export function rateLimit(options: {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
    message?: string;
}) {
    const {
        windowMs,
        max,
        keyGenerator = (req) => req.ip || 'unknown',
        message = 'Too many requests, please try again later'
    } = options;

    const store: RateLimitStore = {};

    // Clean up old entries every 1 minute (or windowMs if larger, but 1 min is safe default check)
    // We'll use a simple interval that clears expired keys
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        Object.keys(store).forEach(key => {
            if (store[key].resetTime < now) {
                delete store[key];
            }
        });
    }, 60000); // Check every minute

    // Determine if we need to unref the interval to prevent keeping the process alive
    // (Node.js specific, assuming this runs in Node)
    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();

        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs
            };
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', max - 1);
            res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
            return next();
        }

        store[key].count++;

        const remaining = Math.max(0, max - store[key].count);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));

        if (store[key].count > max) {
            // If it's a new error, we probably want to throw it
            // checking if the store count is *just* above max to avoid spamming errors if they keep hitting
            // but the requirement is just to throw the error.
            throw new RateLimitError(message);
        }

        next();
    };
}

// QR scan rate limiting - prevent rapid scanning attempts
export const qrScanRateLimit = rateLimit({
    windowMs: 60000, // 1 minute
    max: parseInt(process.env.QR_SCAN_RATE_LIMIT || '10', 10),
    message: 'Too many scan attempts. Please wait before trying again.'
});

// API rate limiting
export const apiRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
});

// Login rate limiting
export const loginRateLimit = rateLimit({
    windowMs: 900000, // 15 minutes
    max: 5,
    keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
    message: 'Too many login attempts. Please try again after 15 minutes.'
});

// Registration rate limiting (stricter: 3 attempts per hour per IP)
export const registrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts from this IP, please try again after an hour'
});
