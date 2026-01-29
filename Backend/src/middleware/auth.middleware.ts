// Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff, users } from '../db/schema';
import { AuthenticationError, AuthorizationError } from '../utils/error-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'member' | 'trainer' | 'staff' | 'admin' | 'manager';
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
    role: 'member' | 'trainer' | 'staff' | 'admin' | 'manager';
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
                .where(eq(members.id, decoded.id))
                .limit(1);
            userExists = member !== undefined && member.deletedAt === null && member.status === 'active';
        } else if (decoded.role === 'trainer') {
            const [result] = await db.select({
                isActive: users.isActive,
                deletedAt: trainers.deletedAt
            })
                .from(trainers)
                .innerJoin(users, eq(trainers.userId, users.id))
                .where(eq(trainers.id, decoded.id))
                .limit(1);
            userExists = result !== undefined && result.deletedAt === null && result.isActive === true;
        } else if (decoded.role === 'staff' || decoded.role === 'manager') {
            const [staffMember] = await db.select({ status: staff.status, deletedAt: staff.deletedAt })
                .from(staff)
                .where(eq(staff.id, decoded.id))
                .limit(1);
            userExists = staffMember !== undefined && staffMember.deletedAt === null && staffMember.status === 'active';
        } else if (decoded.role === 'admin') {
            const [adminUser] = await db.select({ isActive: users.isActive, deletedAt: users.deletedAt })
                .from(users)
                .where(eq(users.id, decoded.id))
                .limit(1);

            if (adminUser) {
                userExists = adminUser.deletedAt === null && adminUser.isActive === true;
            } else {
                const [adminStaff] = await db.select({
                    staffDeletedAt: staff.deletedAt,
                    staffStatus: staff.status,
                    userDeletedAt: users.deletedAt,
                    userIsActive: users.isActive,
                    userRole: users.role
                })
                    .from(staff)
                    .innerJoin(users, eq(staff.userId, users.id))
                    .where(eq(staff.id, decoded.id))
                    .limit(1);

                userExists = adminStaff !== undefined
                    && adminStaff.userRole === 'admin'
                    && adminStaff.userDeletedAt === null
                    && adminStaff.userIsActive === true
                    && adminStaff.staffDeletedAt === null
                    && adminStaff.staffStatus === 'active';
            }
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
