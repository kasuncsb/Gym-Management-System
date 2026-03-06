/**
 * Auth Service - handles all authentication logic
 * FIXES: Separate JWT secrets, proper password validation, unified users table
 */

import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { users, memberProfiles } from '../db/schema.js';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { env } from '../config/env.js';
import { ids } from '../utils/id.js';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password.js';
import { errors } from '../utils/errors.js';
import { sendEmail, generateVerifyEmailHTML, generateResetPasswordHTML } from '../utils/email.js';
import type { LoginInput, RegisterInput, ChangePasswordInput, OnboardingInput } from '../validators/auth.validator.js';

export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<void> {
  const [person] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.role !== 'member') throw errors.forbidden('Onboarding is only for members');

  await db.update(memberProfiles).set({
    experienceLevel: input.experienceLevel,
    fitnessGoals: input.fitnessGoals,
    medicalConditions: input.medicalConditions,
    allergies: input.allergies,
    bloodType: input.bloodType,
    emergencyName: input.emergencyName,
    emergencyPhone: input.emergencyRelation ? input.emergencyPhone : undefined,
    emergencyRelation: input.emergencyRelation,
    isOnboarded: true,
    onboardedAt: new Date(),
  }).where(eq(memberProfiles.personId, userId));
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    memberCode?: string | null;
  };
}

function generateTokens(payload: { sub: string; email: string; role: string; fullName: string }) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: payload.sub, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
    .limit(1);

  if (!person) throw errors.unauthorized('Invalid email or password');

  // Check lock
  if (person.lockedUntil && new Date(person.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(person.lockedUntil).getTime() - Date.now()) / 60000);
    throw errors.unauthorized(`Account locked. Try in ${mins} minutes`);
  }

  if (!person.isActive) throw errors.forbidden('Account is deactivated');

  const valid = await verifyPassword(input.password, person.passwordHash);
  if (!valid) {
    const attempts = person.failedAttempts + 1;
    if (attempts >= 5) {
      await db.update(users).set({ lockedUntil: new Date(Date.now() + 15 * 60000), failedAttempts: 0 }).where(eq(users.id, person.id));
    } else {
      await db.update(users).set({ failedAttempts: attempts }).where(eq(users.id, person.id));
    }
    throw errors.unauthorized('Invalid email or password');
  }

  await db.update(users).set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, person.id));

  const { accessToken, refreshToken } = generateTokens({
    sub: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: person.id, email: person.email, role: person.role, fullName: person.fullName, memberCode: person.memberCode },
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw errors.conflict('Email already registered');

  const personId = ids.uuid();
  const memberCode = ids.memberCode();
  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = ids.resetToken();

  await db.insert(users).values({
    id: personId,
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    phone: input.phone,
    gender: input.gender,
    role: 'member',
    memberCode,
    qrSecret: ids.qrSecret(),
    memberStatus: 'active',
    joinDate: new Date(),
    isActive: true,
    emailVerifyToken,
  });

  await db.insert(memberProfiles).values({
    personId,
    referralSource: 'website',
    isOnboarded: false,
  });

  // Send verification email (fire-and-forget)
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;
  sendEmail(
    input.email,
    'Verify Your Email - PowerWorld Gyms',
    generateVerifyEmailHTML(input.fullName, verifyUrl)
  ).catch(err => console.error('Failed to send verification email:', err));

  const { accessToken, refreshToken } = generateTokens({
    sub: personId,
    email: input.email,
    role: 'member',
    fullName: input.fullName,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: personId, email: input.email, role: 'member', fullName: input.fullName, memberCode },
  };
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; type: string };
    if (decoded.type !== 'refresh') throw errors.unauthorized('Invalid token type');

    const [person] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decoded.sub), eq(users.isActive, true), isNull(users.deletedAt)))
      .limit(1);

    if (!person) throw errors.unauthorized('User not found');

    const tokens = generateTokens({
      sub: person.id,
      email: person.email,
      role: person.role,
      fullName: person.fullName,
    });

    return {
      ...tokens,
      user: { id: person.id, email: person.email, role: person.role, fullName: person.fullName, memberCode: person.memberCode },
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw errors.unauthorized('Refresh token expired');
    if (err instanceof jwt.JsonWebTokenError) throw errors.unauthorized('Invalid refresh token');
    throw err;
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const validation = validatePassword(input.newPassword);
  if (!validation.valid) throw errors.validation('Invalid password', validation.errors);

  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  const valid = await verifyPassword(input.currentPassword, person.passwordHash);
  if (!valid) throw errors.unauthorized('Current password incorrect');

  const newHash = await hashPassword(input.newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
}

export async function getProfile(userId: string) {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  let profile = null;
  if (person.role === 'member') {
    const [mp] = await db.select().from(memberProfiles).where(eq(memberProfiles.personId, userId)).limit(1);
    profile = mp;
  }

  return {
    id: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
    phone: person.phone,
    memberCode: person.memberCode,
    memberStatus: person.memberStatus,
    joinDate: person.joinDate,
    emailVerified: person.emailVerified,
    profile,
  };
}

export async function sendVerificationEmail(userId: string): Promise<void> {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.emailVerified) throw errors.badRequest('Email already verified');

  const verifyToken = ids.resetToken();
  await db.update(users).set({ emailVerifyToken: verifyToken }).where(eq(users.id, userId));

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
  await sendEmail(
    person.email,
    'Verify Your Email - PowerWorld Gyms',
    generateVerifyEmailHTML(person.fullName, verifyUrl)
  );
}

export async function verifyEmail(token: string): Promise<void> {
  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.emailVerifyToken, token), isNull(users.deletedAt)))
    .limit(1);

  if (!person) throw errors.badRequest('Invalid or expired verification token');
  if (person.emailVerified) throw errors.badRequest('Email already verified');

  await db.update(users).set({ emailVerified: true, emailVerifyToken: null }).where(eq(users.id, person.id));
}

export async function forgotPassword(email: string): Promise<void> {
  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  // Don't reveal if user exists (security best practice)
  if (!person) return;

  const resetToken = ids.resetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(users).set({ resetToken, resetExpires }).where(eq(users.id, person.id));

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail(
    person.email,
    'Reset Your Password - PowerWorld Gyms',
    generateResetPasswordHTML(person.fullName, resetUrl)
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword);
  if (!validation.valid) throw errors.validation('Invalid password', validation.errors);

  const [person] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.resetToken, token),
      gt(users.resetExpires, new Date()),
      isNull(users.deletedAt)
    ))
    .limit(1);

  if (!person) throw errors.badRequest('Invalid or expired reset token');

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({
    passwordHash,
    resetToken: null,
    resetExpires: null,
    failedAttempts: 0,
    lockedUntil: null,
  }).where(eq(users.id, person.id));
}
