import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'trainer' | 'member';
  fullName: string;
  emailVerified: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Authenticate middleware — reads ONLY from httpOnly cookie.
 * No Authorization header fallback (production).
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.access_token;
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw errors.unauthorized('Authentication required');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
      emailVerified: decoded.emailVerified ?? false,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(errors.unauthorized('Access token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(errors.unauthorized('Invalid access token'));
    } else {
      next(err);
    }
  }
}

/** Role-based access control middleware */
export function authorize(...roles: AuthUser['role'][]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(errors.forbidden());
    next();
  };
}
