import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain number'),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, 'Invalid phone number format'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  // Emergency contact — mandatory at registration for member safety
  emergencyName: z.string().min(2).max(100),
  emergencyPhone: z.string().regex(/^\+?[\d\s-]{10,20}$/, 'Invalid emergency phone number'),
  emergencyRelation: z.string().min(2).max(50),
  // Health info — optional at registration (create account card)
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  medicalConditions: z.string().max(1000).optional(),
  allergies: z.string().max(500).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const onboardingSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  previousWorkouts: z.string().max(1000).optional(),
  fitnessGoals: z.string().max(500).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  medicalConditions: z.string().max(1000).optional(),
  allergies: z.string().max(500).optional(),
  emergencyName: z.string().max(100).optional(),
  // BUG-21 fix: Removed .or(z.literal('')) that allowed empty string to bypass
  // phone regex validation. Now properly optional (undefined if not provided).
  emergencyPhone: z.string().regex(/^\+?[\d\s-]{10,20}$/).optional(),
  emergencyRelation: z.string().max(50).optional(),
});

export const idVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type IdVerificationInput = z.infer<typeof idVerificationSchema>;
