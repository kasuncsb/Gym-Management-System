// Authentication & Authorization Middleware — Phase 1
// JWT uses users.id everywhere (no profile-ID confusion)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema';
import { env } from '../config/env';
import { AuthenticationError, AuthorizationError } from '../utils/error-types';

// ---- Types ----------------------------------------------------------------

export type Role = 'admin' | 'manager' | 'staff' | 'trainer' | 'member';

export interface JWTPayload {
  userId: string;       // always users.id
  email: string;
  role: Role;
}

/** Extended Express request carrying the verified user claim */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// ---- Middleware ------------------------------------------------------------

/**
 * Verify the Bearer access-token, look up user in DB, and attach `req.user`.
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;

    // Verify user still exists, is active, and not soft-deleted
    const [user] = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        role: users.role,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(and(eq(users.id, decoded.userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('User not found or deactivated');
    }
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    // Ensure role in token still matches DB (prevents stale tokens after role change)
    if (user.role !== decoded.role) {
      throw new AuthenticationError('Token role mismatch — please log in again');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Token expired'));
    }
    next(error);
  }
};

/**
 * Restrict access to specific roles.
 * Usage: `requireRole('admin', 'manager')`
 */
export const requireRole = (...allowed: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access denied. Required roles: ${allowed.join(', ')}`,
        ),
      );
    }
    next();
  };
};

/**
 * Optional auth — attach user if token present, else continue silently.
 */
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const decoded = jwt.verify(
      authHeader.substring(7),
      env.JWT_ACCESS_SECRET,
    ) as JWTPayload;
    req.user = decoded;
  } catch {
    // Silently continue without user
  }
  next();
};

