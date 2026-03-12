/**
 * Auth Controller — orchestrates HTTP layer.
 * Sets/clears httpOnly cookies, delegates business logic to auth.service.
 */
import { Response, CookieOptions } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, validate } from '../middleware/error.js';
import * as response from '../utils/response.js';
import { errors } from '../utils/errors.js';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { downloadFile } from '../utils/oci-storage.js';
import type {
  LoginInput,
  RegisterInput,
  RefreshInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  OnboardingInput,
  IdVerificationInput,
} from '../validators/auth.validator.js';

// ── Cookie config ─────────────────────────────────────────────────────────────
const BASE_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const ACCESS_COOKIE: CookieOptions = { ...BASE_COOKIE, maxAge: 15 * 60 * 1000 };          // 15 min
const REFRESH_COOKIE: CookieOptions = { ...BASE_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days
const CLEAR_COOKIE: CookieOptions = { ...BASE_COOKIE, maxAge: 0 };

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, ACCESS_COOKIE);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE);
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', CLEAR_COOKIE);
  res.clearCookie('refresh_token', CLEAR_COOKIE);
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json(response.success({ user: result.user }, 'Login successful'));
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json(response.success({ user: result.user }, 'Registration successful'));
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) throw errors.unauthorized('No refresh token');
  const result = await authService.refresh(refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json(response.success({ user: result.user }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Best-effort server-side revocation — NEVER block logout with a 500.
  // Cookies are cleared unconditionally; the user is logged out regardless.
  try {
    await authService.logout(req.cookies?.refresh_token);
  } catch (err) {
    console.error('Logout service error (non-fatal, logging out anyway):', err);
  }
  clearAuthCookies(res);
  res.json(response.success(null, 'Logged out successfully'));
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await authService.getProfile(req.user!.id);
  res.json(response.success(profile));
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.changePassword(req.user!.id, req.body as ChangePasswordInput);
  clearAuthCookies(res); // Force re-login on all devices
  res.json(response.success(null, 'Password changed. Please log in again.'));
});

export const sendVerificationEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.sendVerificationEmail(req.user!.id);
  res.json(response.success(null, 'Verification email sent'));
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.verifyEmail((req.body as VerifyEmailInput).token);
  res.json(response.success(null, 'Email verified successfully'));
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.forgotPassword((req.body as ForgotPasswordInput).email);
  res.json(response.success(null, 'If the email exists, a reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body as ResetPasswordInput;
  await authService.resetPassword(token, newPassword);
  res.json(response.success(null, 'Password reset successfully'));
});

export const completeOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.completeOnboarding(req.user!.id, req.body as OnboardingInput);
  res.json(response.success(null, 'Onboarding complete'));
});

// ── ID Verification ───────────────────────────────────────────────────────────
export const uploadIdDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
  if (!files?.nic_front?.[0] || !files?.nic_back?.[0]) {
    throw errors.badRequest('NIC front and back images are required');
  }
  await authService.uploadIdDocuments(
    req.user!.id,
    files.nic_front[0].buffer,
    files.nic_back[0].buffer,
  );
  res.json(response.success(null, 'Documents uploaded. Pending review.'));
});

export const getIdSubmissions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const submissions = await authService.getIdSubmissions();
  res.json(response.success(submissions));
});

export const adminVerifyId = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await authService.adminVerifyId(id, req.body as IdVerificationInput);
  res.json(response.success(null, 'Verification status updated'));
});

/** Stream a private OCI NIC document to the admin — never exposes OCI URLs to browser */
export const downloadIdDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, type } = req.params;
  if (type !== 'front' && type !== 'back') throw errors.badRequest('Invalid document type');

  const { data } = await authService.getIdDocumentObjectName(userId, type as 'front' | 'back');
  if (!data) throw errors.notFound('Document not found');

  const { body, contentType } = await downloadFile(data);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="nic_${type}_${userId}.jpg"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  
  // Stream directly — handle errors to prevent unhandled rejections
  const stream = body as NodeJS.ReadableStream;
  stream.on('error', (err) => {
    console.error(`OCI download stream error for user ${userId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download document' });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
});
