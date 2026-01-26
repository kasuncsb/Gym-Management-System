// Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff } from '../db/schema';
import { AuthenticationError, AuthorizationError } from '../utils/error-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'member' | 'trainer' | 'staff';
        staffRole?: string;
    };
    headers: any;
    params: any;
    query: any;
    body: any;
}

interface JWTPayload {
    id: string;
    email: string;
    role: 'member' | 'trainer' | 'staff';
    staffRole?: string;
}

// Main authentication middleware
export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No authentication token provided');
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // Verify user still exists and is active
        let userExists = false;
        if (decoded.role === 'member') {
            const [member] = await db.select({ status: members.status, deletedAt: members.deletedAt })
                .from(members)
                .where(eq(members.memberId, decoded.id))
                .limit(1);
            userExists = member !== null && member.deletedAt === null && member.status === 'ACTIVE';
        } else if (decoded.role === 'trainer') {
            const [trainer] = await db.select({ status: trainers.status, deletedAt: trainers.deletedAt })
                .from(trainers)
                .where(eq(trainers.trainerId, decoded.id))
                .limit(1);
            userExists = trainer !== null && trainer.deletedAt === null && trainer.status === 'ACTIVE';
        } else if (decoded.role === 'staff') {
            const [staffMember] = await db.select({ status: staff.status, deletedAt: staff.deletedAt })
                .from(staff)
                .where(eq(staff.staffId, decoded.id))
                .limit(1);
            userExists = staffMember !== null && staffMember.deletedAt === null && staffMember.status === 'ACTIVE';
        }

        if (!userExists) {
            throw new AuthenticationError('User not found or inactive');
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthenticationError('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AuthenticationError('Token expired'));
        } else {
            next(error);
        }
    }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AuthenticationError('Not authenticated'));
        }

        const userRole = req.user.role;
        const staffRole = req.user.staffRole;

        const hasRole = allowedRoles.some(role => {
            if (role === userRole) return true;
            if (userRole === 'staff' && staffRole === role) return true;
            return false;
        });

        if (!hasRole) {
            return next(
                new AuthorizationError(
                    `Access denied. Required roles: ${allowedRoles.join(', ')}`
                )
            );
        }

        next();
    };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
    } catch (_error) {
        // Silently continue without user
    }

    next();
};
