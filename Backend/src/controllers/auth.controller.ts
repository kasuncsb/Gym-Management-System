import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import * as response from '../utils/response.js';
import * as authService from '../services/auth.service.js';
import type {
  LoginInput,
  RegisterInput,
  RefreshInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  OnboardingInput,
} from '../validators/auth.validator.js';

export const completeOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.completeOnboarding(req.user!.id, req.body as OnboardingInput);
  res.json(response.success(null, 'Onboarding complete'));
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  res.json(response.success(result, 'Login successful'));
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(response.success(result, 'Registration successful'));
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  const result = await authService.refresh(refreshToken);
  res.json(response.success(result));
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.changePassword(req.user!.id, req.body as ChangePasswordInput);
  res.json(response.success(null, 'Password changed'));
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await authService.getProfile(req.user!.id);
  res.json(response.success(profile));
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(null, 'Logged out'));
});

export const sendVerificationEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.sendVerificationEmail(req.user!.id);
  res.json(response.success(null, 'Verification email sent'));
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body as VerifyEmailInput;
  await authService.verifyEmail(token);
  res.json(response.success(null, 'Email verified successfully'));
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;
  await authService.forgotPassword(email);
  res.json(response.success(null, 'If the email exists, a reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body as ResetPasswordInput;
  await authService.resetPassword(token, newPassword);
  res.json(response.success(null, 'Password reset successful'));
});
