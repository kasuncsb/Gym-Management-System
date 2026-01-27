// Authentication Service - Drizzle ORM
import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff, users } from '../db/schema';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/error-types';
import { generateQRToken, generateQRCode } from '../utils/qr-generator';
import { validateEmail, validatePassword } from '../utils/validators';
import { EmailService } from './email.service';
import { AuditService, AuditAction } from './audit.service';
import { randomUUID } from 'crypto';


const JWT_SECRET: string = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'default-secret-change-this') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET must be set in production environment');
        }
        console.warn('WARNING: Using unsafe JWT secret. Set JWT_SECRET environment variable.');
        return 'development-secret-unsafe-for-production';
    }
    return secret;
})();
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

interface LoginResult {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        staffRole?: string;
    };
}

export class AuthService {
    // Member Authentication
    static async loginMember(email: string, password: string, req?: Request): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [result] = await db.select({
            member: members,
            user: users
        })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .where(eq(users.email, email))
            .limit(1);

        if (!result || result.member.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        const { member, user } = result;

        // Allow 'active' and 'pending' members to log in. 
        // 'pending' status is needed so they can upload verification documents.
        if (member.status === 'inactive' || member.status === 'suspended') {
            throw new AuthenticationError('Account is ' + member.status);
        }

        if (!user.isEmailVerified) {
            throw new AuthenticationError('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: member.id,
                email: user.email,
                role: 'member'
            } as object,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );

        const refreshToken = jwt.sign(
            {
                id: member.id,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Log successful login
        await AuditService.log(
            AuditAction.LOGIN,
            'members',
            member.id,
            user.id,
            { email: user.email, role: 'member' },
            req
        );

        return {
            token,
            refreshToken,
            user: {
                id: member.id,
                name: user.fullName,
                email: user.email,
                role: 'member'
            }
        };
    }

    // Trainer Authentication
    static async loginTrainer(email: string, password: string, req?: Request): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [result] = await db.select({
            trainer: trainers,
            user: users
        })
            .from(trainers)
            .innerJoin(users, eq(trainers.userId, users.id))
            .where(eq(users.email, email))
            .limit(1);

        if (!result || result.trainer.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        const { trainer, user } = result;

        // Trainer table doesn't have status? Schema check...
        // Schema: trainers doesn't have status! 
        // But user has isActive.
        // Wait, schema definitely didn't have status for trainers in my view_file output.
        // Let's check schema again mentally. 
        // trainers has: id, userId, specialization, bio, hourlyRate, rating, branchId, deletedAt.
        // users has: isActive.
        // So I should check user.isActive.

        if (!user.isActive) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (!user.isEmailVerified) {
            throw new AuthenticationError('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: trainer.id,
                email: user.email,
                role: 'trainer'
            } as object,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );

        const refreshToken = jwt.sign(
            {
                id: trainer.id,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Log successful login
        await AuditService.log(
            AuditAction.LOGIN,
            'trainers',
            trainer.id,
            user.id,
            { email: user.email, role: 'trainer' },
            req
        );

        return {
            token,
            refreshToken,
            user: {
                id: trainer.id,
                name: user.fullName,
                email: user.email,
                role: 'trainer'
            }
        };
    }

    // Staff Authentication
    static async loginStaff(email: string, password: string, req?: Request): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [user] = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user || user.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        const [staffMember] = await db.select()
            .from(staff)
            .where(eq(staff.userId, user.id))
            .limit(1);

        // System Admins can log in even without a staff record.
        // Managers and other Staff MUST have an active staff record attached to a branch.
        if (user.role !== 'admin') {
            if (!staffMember || staffMember.status !== 'active' || staffMember.deletedAt) {
                throw new AuthenticationError('Invalid credentials');
            }
        }

        if (!user.isEmailVerified) {
            throw new AuthenticationError('Please verify your email first');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: staffMember?.id || user.id, // Fallback to user ID for admin if staff ID is missing
                email: user.email,
                role: user.role === 'admin' ? 'admin' : 'staff',
                staffRole: user.role
            } as object,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );

        const refreshToken = jwt.sign(
            {
                id: staffMember?.id || user.id,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Log successful login
        await AuditService.log(
            AuditAction.LOGIN,
            'staff',
            staffMember?.id || user.id,
            user.id,
            { email: user.email, role: user.role, designation: staffMember?.designation },
            req
        );

        return {
            token,
            refreshToken,
            user: {
                id: staffMember?.id || user.id,
                name: user.fullName,
                email: user.email,
                role: user.role || 'staff',
                staffRole: user.role
            }
        };
    }

    // Hash password
    static async hashPassword(password: string): Promise<string> {
        const validation = validatePassword(password);
        if (!validation.valid) {
            throw new ValidationError(validation.errors.join('; '));
        }

        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    // Verify password
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    // Generate QR code for member
    static async generateMemberQR(memberId: string): Promise<{
        qrCodeDataUrl: string;
        qrToken: string;
    }> {
        const [member] = await db.select()
            .from(members)
            .where(eq(members.id, memberId)) // memberId -> id
            .limit(1);

        if (!member || member.deletedAt) {
            throw new NotFoundError('Member');
        }

        if (member.status !== 'active') {
            throw new ValidationError('Member account is not active');
        }

        const qrToken = generateQRToken(memberId);
        const qrCodeDataUrl = await generateQRCode(memberId);

        // Update member's QR token - Removed as qrCode column is deprecated
        // await db.update(members)
        //     .set({ qrCode: qrToken })
        //     .where(eq(members.id, memberId));

        return {
            qrCodeDataUrl,
            qrToken
        };
    }

    // Refresh token
    static async refreshToken(refreshToken: string): Promise<{ token: string }> {
        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

            if (decoded.type !== 'refresh') {
                throw new AuthenticationError('Invalid refresh token');
            }

            // Determine user type and fetch user data
            let userData: { id: string, name: string, email: string, role: string, staffRole?: string } | null = null;
            let role: string = '';
            let staffRole: string | undefined;

            // Try Member
            const [memberResult] = await db.select({ member: members, user: users })
                .from(members)
                .innerJoin(users, eq(members.userId, users.id))
                .where(eq(members.id, decoded.id))
                .limit(1);

            if (memberResult && !memberResult.member.deletedAt && memberResult.member.status === 'active') {
                userData = {
                    id: memberResult.member.id,
                    name: memberResult.user.fullName,
                    email: memberResult.user.email,
                    role: 'member'
                };
                role = 'member';
            } else {
                // Try Trainer
                const [trainerResult] = await db.select({ trainer: trainers, user: users })
                    .from(trainers)
                    .innerJoin(users, eq(trainers.userId, users.id))
                    .where(eq(trainers.id, decoded.id))
                    .limit(1);

                if (trainerResult && !trainerResult.trainer.deletedAt && trainerResult.user.isActive) {
                    userData = {
                        id: trainerResult.trainer.id,
                        name: trainerResult.user.fullName,
                        email: trainerResult.user.email,
                        role: 'trainer'
                    };
                    role = 'trainer';
                } else {
                    // Try Staff
                    const [staffResult] = await db.select({ staff: staff, user: users })
                        .from(staff)
                        .innerJoin(users, eq(staff.userId, users.id))
                        .where(eq(staff.id, decoded.id))
                        .limit(1);

                    if (staffResult && !staffResult.staff.deletedAt && staffResult.staff.status === 'active') {
                        userData = {
                            id: staffResult.staff.id,
                            name: staffResult.user.fullName,
                            email: staffResult.user.email,
                            role: staffResult.user.role || 'staff',
                            staffRole: staffResult.user.role || undefined
                        };
                        role = 'staff';
                        staffRole = staffResult.user.role || undefined;
                    } else {
                        throw new AuthenticationError('User not found or inactive');
                    }
                }
            }

            if (!userData) throw new AuthenticationError('User not found');

            const token = jwt.sign(
                {
                    id: userData.id,
                    email: userData.email,
                    role,
                    ...(role === 'staff' && { staffRole })
                } as object,
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN } as SignOptions
            );

            return { token };
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError('Invalid or expired refresh token');
            }
            throw error;
        }
    }

    // Change password
    static async changePassword(
        userId: string, // This userId here is actually memberId/trainerId/staffId based on login logic
        userType: 'member' | 'trainer' | 'staff',
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        let userRecord: { id: string } | undefined;
        let realUserId: string | undefined;

        if (userType === 'member') {
            const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, userId)).limit(1);
            if (mem) realUserId = mem.userId;
        } else if (userType === 'trainer') {
            const [trn] = await db.select({ userId: trainers.userId }).from(trainers).where(eq(trainers.id, userId)).limit(1);
            if (trn) realUserId = trn.userId;
        } else {
            const [stf] = await db.select({ userId: staff.userId }).from(staff).where(eq(staff.id, userId)).limit(1);
            if (stf) realUserId = stf.userId;
        }

        if (!realUserId) {
            throw new NotFoundError('User');
        }

        const [user] = await db.select().from(users).where(eq(users.id, realUserId)).limit(1);

        if (!user) {
            throw new NotFoundError('User');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            throw new AuthenticationError('Current password is incorrect');
        }

        const newPasswordHash = await this.hashPassword(newPassword);

        await db.update(users)
            .set({ passwordHash: newPasswordHash })
            .where(eq(users.id, realUserId));

        await AuditService.log(
            AuditAction.CHANGE_PASSWORD,
            'users',
            realUserId,
            realUserId,
            { userType }
        );
    }

    // Verify Email
    static async verifyEmail(token: string): Promise<boolean> {
        const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);

        if (!user) {
            throw new ValidationError('Invalid or expired verification link');
        }

        // Check if already verified
        if (user.isEmailVerified) {
            throw new ValidationError('Email already verified');
        }

        // Check token expiration
        if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
            // Clear expired token
            await db.update(users)
                .set({
                    emailVerificationToken: null,
                    emailVerificationTokenExpires: null
                })
                .where(eq(users.id, user.id));

            throw new ValidationError('Verification link has expired. Please request a new one');
        }

        await db.update(users)
            .set({
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationTokenExpires: null,
                isActive: true
            })
            .where(eq(users.id, user.id));

        await AuditService.log(
            AuditAction.VERIFY_EMAIL,
            'users',
            user.id,
            user.id
        );

        return true;
    }

    // Forgot Password
    static async forgotPassword(email: string): Promise<void> {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        // Always perform work to prevent timing attacks that reveal if email exists
        const token = randomUUID();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        if (user) {
            await db.update(users)
                .set({
                    passwordResetToken: token,
                    passwordResetExpires: expires
                })
                .where(eq(users.id, user.id));

            try {
                await EmailService.sendPasswordResetEmail(user.email, token);
            } catch (error) {
                console.error('Failed to send reset email:', error);
            }
        } else {
            // Simulate delay to prevent timing attack
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
        }

        // Always return successfully (don't reveal if email exists or not)
    }

    // Reset Password
    static async resetPassword(token: string, newPassword: string): Promise<void> {
        // Validate password strength first
        if (!validatePassword(newPassword)) {
            throw new ValidationError('Password must be at least 8 characters with one uppercase letter and one number');
        }

        const [user] = await db.select().from(users)
            .where(and(
                eq(users.passwordResetToken, token),
                gt(users.passwordResetExpires, new Date())
            ))
            .limit(1);

        if (!user) throw new ValidationError('Invalid or expired reset link');

        const passwordHash = await this.hashPassword(newPassword);

        await db.update(users)
            .set({
                passwordHash,
                passwordResetToken: null,
                passwordResetExpires: null
            })
            .where(eq(users.id, user.id));

        await AuditService.log(
            AuditAction.RESET_PASSWORD,
            'users',
            user.id,
            user.id
        );
    }
}
