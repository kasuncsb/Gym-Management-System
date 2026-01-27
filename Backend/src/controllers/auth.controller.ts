// Authentication Controller
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff, users } from '../db/schema';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
    // Member login
    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password, userType = 'member' } = req.body;

        let result;
        if (userType === 'trainer') {
            result = await AuthService.loginTrainer(email, password, req);
        } else if (userType === 'staff') {
            result = await AuthService.loginStaff(email, password, req);
        } else {
            result = await AuthService.loginMember(email, password, req);
        }

        res.json(successResponse(result, 'Login successful'));
    });

    // Refresh token
    static refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshToken(refreshToken);
        res.json(successResponse(result, 'Token refreshed'));
    });

    // Change password
    static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user!.id;
        const userType = req.user!.role as 'member' | 'trainer' | 'staff';

        await AuthService.changePassword(userId, userType, oldPassword, newPassword);
        res.json(successResponse(null, 'Password changed successfully'));
    });

    // Get current user profile
    static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        let profile;
        if (userRole === 'member') {
            const [result] = await db.select({
                member: members,
                user: users
            })
                .from(members)
                .innerJoin(users, eq(members.userId, users.id))
                .where(eq(members.id, userId))
                .limit(1);

            if (result) {
                profile = {
                    id: result.member.id,
                    name: result.user.fullName,
                    email: result.user.email,
                    phone: result.user.phone,
                    dateOfBirth: result.member.dateOfBirth,
                    joinDate: result.member.joinDate,
                    status: result.member.status
                };
            }
        } else if (userRole === 'trainer') {
            const [result] = await db.select({
                trainer: trainers,
                user: users
            })
                .from(trainers)
                .innerJoin(users, eq(trainers.userId, users.id))
                .where(eq(trainers.id, userId))
                .limit(1);

            if (result) {
                profile = {
                    id: result.trainer.id,
                    name: result.user.fullName,
                    email: result.user.email,
                    phone: result.user.phone,
                    specialization: result.trainer.specialization,
                    status: result.user.isActive ? 'active' : 'inactive' // Trainer has no status column, use user.isActive
                };
            }
        } else if (userRole === 'admin') {
            // Admin ID in token might be User ID OR Staff ID (if they are also staff)
            // First retry finding as direct User ID
            let result = await db.select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            // If not found, try to resolve via Staff table (if token has staff ID)
            if (result.length === 0) {
                const [staffMember] = await db.select({ userId: staff.userId })
                    .from(staff)
                    .where(eq(staff.id, userId))
                    .limit(1);

                if (staffMember) {
                    result = await db.select()
                        .from(users)
                        .where(eq(users.id, staffMember.userId))
                        .limit(1);
                }
            }

            if (result.length > 0) {
                const user = result[0];
                profile = {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: 'admin',
                    status: user.isActive ? 'active' : 'inactive'
                };
            }
        } else {
            const [result] = await db.select({
                staff: staff,
                user: users
            })
                .from(staff)
                .innerJoin(users, eq(staff.userId, users.id))
                .where(eq(staff.id, userId))
                .limit(1);

            if (result) {
                profile = {
                    id: result.staff.id,
                    name: result.user.fullName,
                    email: result.user.email,
                    phone: result.user.phone,
                    role: result.user.role || 'staff',
                    designation: result.staff.designation,
                    status: result.staff.status
                };
            }
        }

        res.json(successResponse(profile, 'Profile retrieved'));
    });

    // Generate member QR code
    static generateQR = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.user!.id;
        const result = await AuthService.generateMemberQR(memberId);
        res.json(successResponse(result, 'QR code generated'));
    });

    // Verify Email
    static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.body;
        await AuthService.verifyEmail(token);
        res.json(successResponse(null, 'Email verified successfully'));
    });

    // Forgot Password
    static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        await AuthService.forgotPassword(email);
        res.json(successResponse(null, 'If your email is registered, you will receive a password reset link'));
    });

    // Reset Password
    static resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, newPassword } = req.body;
        await AuthService.resetPassword(token, newPassword);
        res.json(successResponse(null, 'Password reset successfully'));
    });
}
