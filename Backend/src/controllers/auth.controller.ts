// Authentication Controller — Phase 1
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users, members, staff, trainers } from '../db/schema';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  // POST /api/auth/login
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, req);
    res.json(successResponse(result, 'Login successful'));
  });

  // POST /api/auth/refresh
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.json(successResponse(result, 'Token refreshed'));
  });

  // POST /api/auth/logout
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.logout(req.user!.userId);
    res.json(successResponse(null, 'Logged out'));
  });

  // POST /api/auth/change-password
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user!.userId, oldPassword, newPassword);
    res.json(successResponse(null, 'Password changed successfully'));
  });

  // GET /api/auth/profile
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });

    // Base profile
    const profile: Record<string, any> = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
    };

    // Attach role-specific data
    if (role === 'member') {
      const [m] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
      if (m) Object.assign(profile, {
        memberCode: m.memberCode, joinDate: m.joinDate, experienceLevel: m.experienceLevel,
        status: m.status, isOnboarded: m.isOnboarded,
      });
    } else if (role === 'trainer') {
      const [t] = await db.select().from(trainers).where(eq(trainers.userId, userId)).limit(1);
      if (t) Object.assign(profile, {
        specialization: t.specialization, bio: t.bio, certifications: t.certifications,
        hourlyRate: t.hourlyRate, rating: t.rating, maxClients: t.maxClients,
      });
    } else if (role === 'staff' || role === 'manager') {
      const [s] = await db.select().from(staff).where(eq(staff.userId, userId)).limit(1);
      if (s) Object.assign(profile, {
        employeeCode: s.employeeCode, designation: s.designation,
        hireDate: s.hireDate, staffStatus: s.status,
      });
    }

    res.json(successResponse(profile, 'Profile retrieved'));
  });

  // GET /api/auth/qr-code
  static generateQR = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.generateMemberQR(req.user!.userId);
    res.json(successResponse(result, 'QR code generated'));
  });

  // POST /api/auth/verify-email
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    await AuthService.verifyEmail(token);
    res.json(successResponse(null, 'Email verified successfully'));
  });

  // POST /api/auth/forgot-password
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    res.json(successResponse(null, 'If your email is registered, you will receive a password reset link'));
  });

  // POST /api/auth/reset-password
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    res.json(successResponse(null, 'Password reset successfully'));
  });
}

