// Authentication Controller
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { members, trainers, staff } from '../db/schema';
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
            result = await AuthService.loginTrainer(email, password);
        } else if (userType === 'staff') {
            result = await AuthService.loginStaff(email, password);
        } else {
            result = await AuthService.loginMember(email, password);
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
            [profile] = await db.select({
                memberId: members.memberId,
                name: members.name,
                email: members.email,
                phone: members.phone,
                dateOfBirth: members.dateOfBirth,
                joinDate: members.joinDate,
                status: members.status
            })
                .from(members)
                .where(eq(members.memberId, userId))
                .limit(1);
        } else if (userRole === 'trainer') {
            [profile] = await db.select({
                trainerId: trainers.trainerId,
                name: trainers.name,
                email: trainers.email,
                phone: trainers.phone,
                specialization: trainers.specialization,
                status: trainers.status
            })
                .from(trainers)
                .where(eq(trainers.trainerId, userId))
                .limit(1);
        } else {
            [profile] = await db.select({
                staffId: staff.staffId,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role,
                status: staff.status
            })
                .from(staff)
                .where(eq(staff.staffId, userId))
                .limit(1);
        }

        res.json(successResponse(profile, 'Profile retrieved'));
    });

    // Generate member QR code
    static generateQR = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.user!.id;
        const result = await AuthService.generateMemberQR(memberId);
        res.json(successResponse(result, 'QR code generated'));
    });
}
