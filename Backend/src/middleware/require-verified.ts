import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { errors } from '../utils/errors.js';

/**
 * Middleware: requires the authenticated user to have verified their email.
 * Applied to sensitive operations like change-password.
 */
export function requireVerified(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) return next(errors.unauthorized());
  if (!req.user.emailVerified) {
    return next(errors.forbidden('Email verification required. Please verify your email before performing this action.'));
  }
  next();
}
