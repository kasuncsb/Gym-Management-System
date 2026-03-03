import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'trainer' | 'member';
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw errors.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(errors.unauthorized('Token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(errors.unauthorized('Invalid token'));
    } else {
      next(err);
    }
  }
}

export function authorize(...roles: AuthUser['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(errors.forbidden());
    next();
  };
}
