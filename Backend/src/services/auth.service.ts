// Authentication Service - Drizzle ORM
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff } from '../db/schema';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/error-types';
import { generateQRToken, generateQRCode } from '../utils/qr-generator';
import { validateEmail, validatePassword } from '../utils/validators';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-change-this';
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
    };
}

export class AuthService {
    // Member Authentication
    static async loginMember(email: string, password: string): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [member] = await db.select({
            memberId: members.memberId,
            name: members.name,
            email: members.email,
            passwordHash: members.passwordHash,
            status: members.status,
            deletedAt: members.deletedAt
        })
            .from(members)
            .where(eq(members.email, email))
            .limit(1);

        if (!member || member.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (member.status !== 'ACTIVE') {
            throw new AuthenticationError('Account is not active');
        }

        const isPasswordValid = await bcrypt.compare(password, member.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        // @ts-expect-error - jwt.sign types are overly strict, this is valid
        const token = jwt.sign(
            {
                id: member.memberId,
                email: member.email,
                role: 'member'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            {
                id: member.memberId,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            refreshToken,
            user: {
                id: member.memberId,
                name: member.name,
                email: member.email,
                role: 'member'
            }
        };
    }

    // Trainer Authentication
    static async loginTrainer(email: string, password: string): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [trainer] = await db.select({
            trainerId: trainers.trainerId,
            name: trainers.name,
            email: trainers.email,
            passwordHash: trainers.passwordHash,
            status: trainers.status,
            deletedAt: trainers.deletedAt
        })
            .from(trainers)
            .where(eq(trainers.email, email))
            .limit(1);

        if (!trainer || trainer.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (trainer.status !== 'ACTIVE') {
            throw new AuthenticationError('Account is not active');
        }

        const isPasswordValid = await bcrypt.compare(password, trainer.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        // @ts-expect-error - jwt.sign types are overly strict, this is valid
        const token = jwt.sign(
            {
                id: trainer.trainerId,
                email: trainer.email,
                role: 'trainer'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            {
                id: trainer.trainerId,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            refreshToken,
            user: {
                id: trainer.trainerId,
                name: trainer.name,
                email: trainer.email,
                role: 'trainer'
            }
        };
    }

    // Staff Authentication
    static async loginStaff(email: string, password: string): Promise<LoginResult> {
        if (!validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        const [staffMember] = await db.select({
            staffId: staff.staffId,
            name: staff.name,
            email: staff.email,
            passwordHash: staff.passwordHash,
            role: staff.role,
            status: staff.status,
            deletedAt: staff.deletedAt
        })
            .from(staff)
            .where(eq(staff.email, email))
            .limit(1);

        if (!staffMember || staffMember.deletedAt) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (staffMember.status !== 'ACTIVE') {
            throw new AuthenticationError('Account is not active');
        }

        const isPasswordValid = await bcrypt.compare(password, staffMember.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        // @ts-expect-error - jwt.sign types are overly strict, this is valid
        const token = jwt.sign(
            {
                id: staffMember.staffId,
                email: staffMember.email,
                role: 'staff',
                staffRole: staffMember.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            {
                id: staffMember.staffId,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            refreshToken,
            user: {
                id: staffMember.staffId,
                name: staffMember.name,
                email: staffMember.email,
                role: staffMember.role
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
        const [member] = await db.select({
            memberId: members.memberId,
            deletedAt: members.deletedAt,
            status: members.status
        })
            .from(members)
            .where(eq(members.memberId, memberId))
            .limit(1);

        if (!member || member.deletedAt) {
            throw new NotFoundError('Member');
        }

        if (member.status !== 'ACTIVE') {
            throw new ValidationError('Member account is not active');
        }

        const qrToken = generateQRToken(memberId);
        const qrCodeDataUrl = await generateQRCode(memberId);

        // Update member's QR token
        await db.update(members)
            .set({ qrCodeToken: qrToken })
            .where(eq(members.memberId, memberId));

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
            let user: any;
            let role: string;

            const [member] = await db.select({
                memberId: members.memberId,
                email: members.email,
                status: members.status,
                deletedAt: members.deletedAt
            })
                .from(members)
                .where(eq(members.memberId, decoded.id))
                .limit(1);

            if (member && !member.deletedAt && member.status === 'ACTIVE') {
                user = member;
                role = 'member';
            } else {
                const [trainer] = await db.select({
                    trainerId: trainers.trainerId,
                    email: trainers.email,
                    status: trainers.status,
                    deletedAt: trainers.deletedAt
                })
                    .from(trainers)
                    .where(eq(trainers.trainerId, decoded.id))
                    .limit(1);

                if (trainer && !trainer.deletedAt && trainer.status === 'ACTIVE') {
                    user = trainer;
                    role = 'trainer';
                } else {
                    const [staffMember] = await db.select({
                        staffId: staff.staffId,
                        email: staff.email,
                        role: staff.role,
                        status: staff.status,
                        deletedAt: staff.deletedAt
                    })
                        .from(staff)
                        .where(eq(staff.staffId, decoded.id))
                        .limit(1);

                    if (staffMember && !staffMember.deletedAt && staffMember.status === 'ACTIVE') {
                        user = staffMember;
                        role = 'staff';
                    } else {
                        throw new AuthenticationError('User not found or inactive');
                    }
                }
            }

            // @ts-expect-error - jwt.sign types are overly strict, this is valid
            const token = jwt.sign(
                {
                    id: decoded.id,
                    email: user.email,
                    role,
                    ...(role === 'staff' && { staffRole: user.role })
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
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
        userId: string,
        userType: 'member' | 'trainer' | 'staff',
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        let user: any;

        if (userType === 'member') {
            [user] = await db.select({
                passwordHash: members.passwordHash
            })
                .from(members)
                .where(eq(members.memberId, userId))
                .limit(1);
        } else if (userType === 'trainer') {
            [user] = await db.select({
                passwordHash: trainers.passwordHash
            })
                .from(trainers)
                .where(eq(trainers.trainerId, userId))
                .limit(1);
        } else {
            [user] = await db.select({
                passwordHash: staff.passwordHash
            })
                .from(staff)
                .where(eq(staff.staffId, userId))
                .limit(1);
        }

        if (!user) {
            throw new NotFoundError('User');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            throw new AuthenticationError('Current password is incorrect');
        }

        const newPasswordHash = await this.hashPassword(newPassword);

        if (userType === 'member') {
            await db.update(members)
                .set({ passwordHash: newPasswordHash })
                .where(eq(members.memberId, userId));
        } else if (userType === 'trainer') {
            await db.update(trainers)
                .set({ passwordHash: newPasswordHash })
                .where(eq(trainers.trainerId, userId));
        } else {
            await db.update(staff)
                .set({ passwordHash: newPasswordHash })
                .where(eq(staff.staffId, userId));
        }
    }
}
