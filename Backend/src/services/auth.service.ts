/**
 * Auth Service — handles all authentication logic.
 * Uses Redis for server-side refresh token revocation.
 * JTI (JWT ID) embedded in refresh tokens for reuse detection.
 */

import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db } from '../config/database.js';
import { users, memberProfiles } from '../db/schema.js';
import { eq, and, isNull, isNotNull, gt, sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { ids } from '../utils/id.js';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password.js';
import { errors } from '../utils/errors.js';
import { sendEmail, generateVerifyEmailHTML, generateResetPasswordHTML } from '../utils/email.js';
import { setRefreshToken, getRefreshToken, consumeRefreshToken, deleteRefreshToken, deleteAllUserTokens } from '../utils/redis.js';
import { uploadFile } from '../utils/oci-storage.js';
import type {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  OnboardingInput,
  IdVerificationInput,
} from '../validators/auth.validator.js';

// ── Token shape returned to controller ────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    memberCode?: string | null;
  };
}

// ── Token generation ──────────────────────────────────────────────────────────
interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  fullName: string;
  emailVerified: boolean;
}

async function generateTokens(payload: TokenPayload): Promise<TokenPair> {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

  // jti (JWT ID) stored in Redis to enable single-use revocation
  const jti = nanoid(32);
  const refreshToken = jwt.sign(
    { sub: payload.sub, jti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );

  await setRefreshToken(jti, payload.sub);
  return { accessToken, refreshToken };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(input: LoginInput): Promise<AuthResult> {
  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
    .limit(1);

  if (!person) throw errors.unauthorized('Invalid email or password');

  if (person.lockedUntil && new Date(person.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(person.lockedUntil).getTime() - Date.now()) / 60000);
    throw errors.unauthorized(`Account locked. Try again in ${mins} minute${mins > 1 ? 's' : ''}`);
  }

  if (!person.isActive) throw errors.forbidden('Account is deactivated');

  const valid = await verifyPassword(input.password, person.passwordHash);
  if (!valid) {
    const attempts = person.failedAttempts + 1;
    if (attempts >= 5) {
      await db.update(users)
        .set({ lockedUntil: new Date(Date.now() + 15 * 60_000), failedAttempts: 0 })
        .where(eq(users.id, person.id));
    } else {
      await db.update(users)
        .set({ failedAttempts: sql`${users.failedAttempts} + 1` })
        .where(eq(users.id, person.id));
    }
    throw errors.unauthorized('Invalid email or password');
  }

  await db.update(users)
    .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, person.id));

  const tokens = await generateTokens({
    sub: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
    emailVerified: person.emailVerified,
  });

  return {
    ...tokens,
    user: { id: person.id, email: person.email, role: person.role, fullName: person.fullName, memberCode: person.memberCode },
  };
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(input: RegisterInput): Promise<AuthResult> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw errors.conflict('Email already registered');

  const personId = ids.uuid();
  const memberCode = ids.memberCode();
  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = ids.resetToken();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
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

    await tx.insert(memberProfiles).values({
      personId,
      referralSource: 'website',
      isOnboarded: false,
      emergencyName: input.emergencyName,
      emergencyPhone: input.emergencyPhone,
      emergencyRelation: input.emergencyRelation,
    });
  });

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;
  sendEmail(
    input.email,
    'Verify Your Email — PowerWorld Gyms',
    generateVerifyEmailHTML(input.fullName, verifyUrl),
  ).catch(err => console.error('Failed to send verification email:', err));

  const tokens = await generateTokens({
    sub: personId,
    email: input.email,
    role: 'member',
    fullName: input.fullName,
    emailVerified: false,
  });

  return {
    ...tokens,
    user: { id: personId, email: input.email, role: 'member', fullName: input.fullName, memberCode },
  };
}

// ── Refresh ───────────────────────────────────────────────────────────────────
export async function refresh(refreshToken: string): Promise<AuthResult> {
  let decoded: { sub: string; jti: string; type: string };

  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw errors.unauthorized('Refresh token expired');
    throw errors.unauthorized('Invalid refresh token');
  }

  if (decoded.type !== 'refresh') throw errors.unauthorized('Invalid token type');

  // Verify JTI exists in Redis — single-use enforcement with automatic reuse detection
  const userId = await consumeRefreshToken(decoded.jti);
  if (!userId) {
    // Token reuse detected — another process already used this JTI — revoke all sessions
    await deleteAllUserTokens(decoded.sub);
    throw errors.unauthorized('Refresh token already used or revoked. Please log in again.');
  }

  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, decoded.sub), eq(users.isActive, true), isNull(users.deletedAt)))
    .limit(1);

  if (!person) throw errors.unauthorized('User not found');

  const tokens = await generateTokens({
    sub: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
    emailVerified: person.emailVerified,
  });

  return {
    ...tokens,
    user: { id: person.id, email: person.email, role: person.role, fullName: person.fullName, memberCode: person.memberCode },
  };
}

// ── Logout ───────────────────────────────────────────────────────────────────────────────
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;

  // Use decode() not verify() — the token may be expired but we still want
  // its sub (userId) to wipe ALL sessions for that user from Redis, giving a
  // clean full-logout from all devices. verify() would throw on expiry and
  // the Redis cleanup would silently be skipped.
  const decoded = jwt.decode(refreshToken) as { sub?: string; jti?: string; type?: string } | null;
  if (!decoded?.sub || decoded.type !== 'refresh') return;

  // Revoke every active session for this user in one shot.
  await deleteAllUserTokens(decoded.sub);
}

// ── Change Password ───────────────────────────────────────────────────────────
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const validation = validatePassword(input.newPassword);
  if (!validation.valid) throw errors.validation('Invalid password', validation.errors);

  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  const valid = await verifyPassword(input.currentPassword, person.passwordHash);
  if (!valid) throw errors.unauthorized('Current password incorrect');

  const newHash = await hashPassword(input.newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

  // Revoke all refresh tokens — force re-login on all devices
  await deleteAllUserTokens(userId);
}

// ── Get Profile ───────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  let profile = null;
  if (person.role === 'member') {
    // BUG-16 fix: Explicitly select only the fields the frontend needs.
    // Using db.select() with no column spec returns ALL columns including
    // sensitive fields like medicalConditions, allergies, and emergency contacts.
    const [mp] = await db
      .select({
        isOnboarded: memberProfiles.isOnboarded,
        fitnessGoals: memberProfiles.fitnessGoals,
        experienceLevel: memberProfiles.experienceLevel,
      })
      .from(memberProfiles)
      .where(eq(memberProfiles.personId, userId))
      .limit(1);
    profile = mp ?? null;
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
    idVerificationStatus: person.idVerificationStatus,
    idVerificationNote: person.idVerificationNote,
    idSubmittedAt: person.idSubmittedAt,
    profile,
  };
}

// ── Email Verification ────────────────────────────────────────────────────────
export async function sendVerificationEmail(userId: string): Promise<void> {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.emailVerified) throw errors.badRequest('Email already verified');

  const verifyToken = ids.resetToken();
  await db.update(users).set({ emailVerifyToken: verifyToken }).where(eq(users.id, userId));

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
  await sendEmail(
    person.email,
    'Verify Your Email — PowerWorld Gyms',
    generateVerifyEmailHTML(person.fullName, verifyUrl),
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

// ── Forgot / Reset Password ───────────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<void> {
  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (!person) return; // Don't reveal user existence

  const resetToken = ids.resetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(users).set({ resetToken, resetExpires }).where(eq(users.id, person.id));

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail(
    person.email,
    'Reset Your Password — PowerWorld Gyms',
    generateResetPasswordHTML(person.fullName, resetUrl),
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword);
  if (!validation.valid) throw errors.validation('Invalid password', validation.errors);

  const [person] = await db
    .select()
    .from(users)
    .where(and(eq(users.resetToken, token), gt(users.resetExpires!, new Date()), isNull(users.deletedAt)))
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

  await deleteAllUserTokens(person.id);
}

// ── Onboarding ────────────────────────────────────────────────────────────────
export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<void> {
  const [person] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.role !== 'member') throw errors.forbidden('Onboarding is only for members');

  // BUG-17 fix: Prevent re-submitting onboarding once completed.
  const [mp] = await db.select({ isOnboarded: memberProfiles.isOnboarded })
    .from(memberProfiles).where(eq(memberProfiles.personId, userId)).limit(1);
  if (mp?.isOnboarded) throw errors.conflict('Onboarding already completed');

  await db.update(memberProfiles).set({
    experienceLevel: input.experienceLevel,
    fitnessGoals: input.fitnessGoals,
    medicalConditions: input.medicalConditions,
    allergies: input.allergies,
    bloodType: input.bloodType,
    emergencyName: input.emergencyName,
    emergencyPhone: input.emergencyPhone,
    emergencyRelation: input.emergencyRelation,
    isOnboarded: true,
    onboardedAt: new Date(),
  }).where(eq(memberProfiles.personId, userId));
}

// ── ID Document Upload ────────────────────────────────────────────────────────
export async function uploadIdDocuments(
  userId: string,
  nicFrontBuffer: Buffer,
  nicBackBuffer: Buffer,
): Promise<void> {
  // BUG-18 fix: Prevent re-uploading if identity already approved.
  // Without this, an approved member re-uploading would silently reset
  // their verified status back to 'pending'.
  const [current] = await db
    .select({ idVerificationStatus: users.idVerificationStatus })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (current?.idVerificationStatus === 'approved') {
    throw errors.conflict('Identity already verified. Contact support to update your documents.');
  }

  const ts = Date.now();
  const nicFrontUrl = await uploadFile(nicFrontBuffer, `id/${userId}/nic_front_${ts}.jpg`, 'image/jpeg');
  const nicBackUrl = await uploadFile(nicBackBuffer, `id/${userId}/nic_back_${ts}.jpg`, 'image/jpeg');

  await db.update(users).set({
    idNicFront: nicFrontUrl,
    idNicBack: nicBackUrl,
    idVerificationStatus: 'pending',
    idSubmittedAt: new Date(),
    idVerificationNote: null,
  }).where(eq(users.id, userId));
}

// ── Admin: Get Pending ID Submissions ─────────────────────────────────────────
export async function getIdSubmissions() {
  // BUG-07 fix: Previously returned ALL members. Now filters to only those
  // who have submitted at least one ID document (idNicFront IS NOT NULL).
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      memberCode: users.memberCode,
      idNicFront: users.idNicFront,
      idNicBack: users.idNicBack,
      idVerificationStatus: users.idVerificationStatus,
      idVerificationNote: users.idVerificationNote,
      idSubmittedAt: users.idSubmittedAt,
    })
    .from(users)
    .where(and(
      eq(users.role, 'member'),
      isNull(users.deletedAt),
      isNotNull(users.idNicFront),
    ));
}

// ── Admin: Get Object Name for Private OCI Download ──────────────────────────
export async function getIdDocumentObjectName(
  userId: string,
  type: 'front' | 'back',
): Promise<{ data: string | null }> {
  const [person] = await db
    .select({ idNicFront: users.idNicFront, idNicBack: users.idNicBack })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!person) throw errors.notFound('User');
  return { data: type === 'front' ? person.idNicFront ?? null : person.idNicBack ?? null };
}
export async function adminVerifyId(
  targetUserId: string,
  input: IdVerificationInput,
): Promise<void> {
  const [person] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!person) throw errors.notFound('User');

  await db.update(users).set({
    idVerificationStatus: input.status,
    idVerificationNote: input.note ?? null,
  }).where(eq(users.id, targetUserId));

  // Notify member via email
  const subject = input.status === 'approved'
    ? 'Identity Verified — PowerWorld Gyms'
    : 'Identity Verification Update — PowerWorld Gyms';

  const body = input.status === 'approved'
    ? `<p>Hi ${person.fullName},</p><p>Your identity has been verified. Welcome to PowerWorld Gyms!</p>`
    : `<p>Hi ${person.fullName},</p><p>Your identity verification was not approved.</p>${input.note ? `<p>Reason: ${input.note}</p>` : ''}<p>Please re-upload your documents via the app.</p>`;

  sendEmail(person.email, subject, body).catch(err => console.error('ID verification email failed:', err));
}
