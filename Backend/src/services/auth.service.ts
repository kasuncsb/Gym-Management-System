/**
 * Auth Service — handles all authentication logic.
 * Uses Redis for server-side refresh token revocation.
 * JTI (JWT ID) embedded in refresh tokens for reuse detection.
 */

import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db } from '../config/database.js';
import { users, members } from '../db/schema.js';
import { userLc } from '../db/lifecycleAliases.js';
import { eq, and, isNull, isNotNull, gt, sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { ids } from '../utils/id.js';
import { insertLifecycleRow } from '../utils/lifecycle.js';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password.js';
import { errors } from '../utils/errors.js';
import { sendEmail, generateVerifyEmailHTML, generateResetPasswordHTML, generateIdVerificationHTML } from '../utils/email.js';
import { setRefreshToken, getRefreshToken, consumeRefreshToken, deleteRefreshToken, deleteAllUserTokens } from '../utils/redis.js';
import { uploadFile } from '../utils/oci-storage.js';
import { getConfigInt } from './config.service.js';
import type {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  OnboardingInput,
  IdVerificationInput,
  UpdateProfileInput,
} from '../validators/auth.validator.js';

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
    phone?: string | null;
    avatarKey?: string | null;
    coverKey?: string | null;
    memberCode?: string | null;
    emailVerified?: boolean;
    isOnboarded?: boolean;
  };
  verificationEmailSent?: boolean;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  fullName: string;
  emailVerified: boolean;
}

async function generateTokens(payload: TokenPayload): Promise<TokenPair> {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const jti = nanoid(32);
  const refreshToken = jwt.sign(
    { sub: payload.sub, jti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );
  await setRefreshToken(jti, payload.sub);
  return { accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const [row] = await db
    .select({ person: users })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .where(and(eq(users.email, input.email), isNull(userLc.deletedAt)))
    .limit(1);

  const person = row?.person;
  if (!person) throw errors.unauthorized('Invalid email or password');

  if (person.lockedUntil && new Date(person.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(person.lockedUntil).getTime() - Date.now()) / 60000);
    throw errors.unauthorized(`Account locked. Try again in ${mins} minute${mins > 1 ? 's' : ''}`);
  }

  if (!person.isActive) throw errors.forbidden('Account is deactivated');

  const valid = await verifyPassword(input.password, person.passwordHash);
  if (!valid) {
    const lockThreshold = await getConfigInt('login_failure_lock_threshold', 5);
    const lockMinutes = await getConfigInt('login_failure_lock_minutes', 15);
    const attempts = person.failedAttempts + 1;
    if (attempts >= lockThreshold) {
      await db.update(users)
        .set({ lockedUntil: new Date(Date.now() + lockMinutes * 60_000), failedAttempts: 0 })
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

  let isOnboarded: boolean | undefined;
  if (person.role === 'member') {
    const [mp] = await db
      .select({ isOnboarded: members.isOnboarded })
      .from(members)
      .where(eq(members.userId, person.id))
      .limit(1);
    isOnboarded = mp?.isOnboarded ?? false;
  }

  const [m] = person.role === 'member'
    ? await db.select({ memberCode: members.memberCode }).from(members).where(eq(members.userId, person.id)).limit(1)
    : [null];

  return {
    ...tokens,
    user: {
      id: person.id,
      email: person.email,
      role: person.role,
      fullName: person.fullName,
      phone: person.phone ?? null,
      avatarKey: person.avatarKey ?? null,
      coverKey: person.coverKey ?? null,
      memberCode: m?.memberCode ?? null,
      emailVerified: person.emailVerified,
      isOnboarded,
    },
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw errors.conflict('Email already registered');

  const personId = ids.uuid();
  const memberCode = ids.memberCode();
  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = ids.resetToken();

  await db.transaction(async (tx) => {
    const userLid = await insertLifecycleRow(tx);
    const memberLid = await insertLifecycleRow(tx);
    await tx.insert(users).values({
      id: personId,
      lifecycleId: userLid,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      gender: input.gender,
      role: 'member',
      qrSecret: ids.qrSecret(),
      isActive: true,
      emailVerifyToken,
    });
    await tx.insert(members).values({
      userId: personId,
      lifecycleId: memberLid,
      memberCode,
      memberStatus: 'active',
      joinDate: new Date(),
      isOnboarded: false,
      emergencyName: input.emergencyName,
      emergencyPhone: input.emergencyPhone,
      emergencyRelation: input.emergencyRelation,
      bloodType: input.bloodType ?? null,
      medicalConditions: input.medicalConditions ?? null,
      allergies: input.allergies ?? null,
    });
  });

  const verifyUrl = `${env.FRONTEND_URL}/member/verify-email?token=${emailVerifyToken}`;
  let verificationEmailSent = false;
  try {
    await sendEmail(
      input.email,
      'Verify Your Email — GymSphere',
      generateVerifyEmailHTML(input.fullName, verifyUrl),
    );
    verificationEmailSent = true;
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  const tokens = await generateTokens({
    sub: personId,
    email: input.email,
    role: 'member',
    fullName: input.fullName,
    emailVerified: false,
  });

  return {
    ...tokens,
    user: {
      id: personId,
      email: input.email,
      role: 'member',
      fullName: input.fullName,
      phone: input.phone ?? null,
      avatarKey: null,
      coverKey: null,
      memberCode,
      emailVerified: false,
      isOnboarded: false,
    },
    verificationEmailSent,
  };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  if (!refreshToken || refreshToken.trim() === '') {
    throw errors.unauthorized('No refresh token');
  }

  let decoded: { sub: string; jti: string; type: string };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw errors.unauthorized('Refresh token expired');
    if (err instanceof jwt.JsonWebTokenError) throw errors.unauthorized('Invalid refresh token');
    throw err;
  }

  if (!decoded?.sub || !decoded?.jti || decoded.type !== 'refresh') {
    throw errors.unauthorized('Invalid token format');
  }

  let userId: string | null;
  try {
    userId = await consumeRefreshToken(decoded.jti);
  } catch (err) {
    console.error('Redis error during token refresh:', err);
    throw errors.serviceUnavailable('Session service temporarily unavailable. Please try again.');
  }

  if (!userId) {
    try {
      await deleteAllUserTokens(decoded.sub);
    } catch (e) {
      console.error('Redis error during token revocation:', e);
    }
    throw errors.unauthorized('Refresh token already used or revoked. Please log in again.');
  }

  const [row] = await db
    .select({ person: users })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .where(and(eq(users.id, decoded.sub), eq(users.isActive, true), isNull(userLc.deletedAt)))
    .limit(1);

  const person = row?.person;
  if (!person) throw errors.unauthorized('User not found');

  const tokens = await generateTokens({
    sub: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
    emailVerified: person.emailVerified,
  });

  let isOnboarded: boolean | undefined;
  if (person.role === 'member') {
    const [mp] = await db
      .select({ isOnboarded: members.isOnboarded })
      .from(members)
      .where(eq(members.userId, person.id))
      .limit(1);
    isOnboarded = mp?.isOnboarded ?? false;
  }

  const [m] = person.role === 'member'
    ? await db.select({ memberCode: members.memberCode }).from(members).where(eq(members.userId, person.id)).limit(1)
    : [null];

  return {
    ...tokens,
    user: {
      id: person.id,
      email: person.email,
      role: person.role,
      fullName: person.fullName,
      phone: person.phone ?? null,
      avatarKey: person.avatarKey ?? null,
      coverKey: person.coverKey ?? null,
      memberCode: m?.memberCode ?? null,
      emailVerified: person.emailVerified,
      isOnboarded,
    },
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  const decoded = jwt.decode(refreshToken) as { sub?: string; jti?: string; type?: string } | null;
  if (!decoded?.sub || decoded.type !== 'refresh') return;
  try {
    await deleteAllUserTokens(decoded.sub);
  } catch (err) {
    console.error(`Logout Redis cleanup failed for user ${decoded.sub} (non-fatal):`, err);
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
  await deleteAllUserTokens(userId);
}

export async function getProfile(userId: string) {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  let profile = null;
  let memberRow = null;
  if (person.role === 'member') {
    const [mp] = await db
      .select({
        isOnboarded: members.isOnboarded,
        fitnessGoals: members.fitnessGoals,
        experienceLevel: members.experienceLevel,
        emergencyName: members.emergencyName,
        emergencyPhone: members.emergencyPhone,
        emergencyRelation: members.emergencyRelation,
      })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);
    profile = mp ?? null;
    const [fullM] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
    memberRow = fullM ?? null;
  }

  return {
    id: person.id,
    email: person.email,
    role: person.role,
    fullName: person.fullName,
    phone: person.phone,
    dob: person.dob,
    gender: person.gender,
    avatarKey: person.avatarKey ?? null,
    coverKey: person.coverKey ?? null,
    memberCode: memberRow?.memberCode ?? null,
    memberStatus: memberRow?.memberStatus ?? null,
    joinDate: memberRow?.joinDate ?? null,
    emailVerified: person.emailVerified,
    idVerificationStatus: memberRow?.idVerificationStatus ?? null,
    idVerificationNote: memberRow?.idVerificationNote ?? null,
    idSubmittedAt: memberRow?.idSubmittedAt ?? null,
    profile,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
  const [person] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  const userUpdates: Partial<{
    fullName: string;
    phone: string | null;
    dob: Date | null;
    gender: 'male' | 'female' | 'other' | null;
  }> = {};
  if (input.fullName !== undefined) userUpdates.fullName = input.fullName;
  if (input.phone !== undefined) userUpdates.phone = input.phone === '' ? null : input.phone;
  if (input.dob !== undefined) userUpdates.dob = input.dob ? new Date(input.dob) : null;
  if (input.gender !== undefined) userUpdates.gender = input.gender as 'male' | 'female' | 'other' | null;

  if (Object.keys(userUpdates).length > 0) {
    await db.update(users).set(userUpdates).where(eq(users.id, userId));
  }

  if (person.role === 'member' && (input.emergencyName !== undefined || input.emergencyPhone !== undefined || input.emergencyRelation !== undefined)) {
    const [mp] = await db.select({ userId: members.userId }).from(members).where(eq(members.userId, userId)).limit(1);
    if (mp) {
      const mpUpdates: Partial<{ emergencyName: string | null; emergencyPhone: string | null; emergencyRelation: string | null }> = {};
      if (input.emergencyName !== undefined) mpUpdates.emergencyName = input.emergencyName || null;
      if (input.emergencyPhone !== undefined) mpUpdates.emergencyPhone = input.emergencyPhone === '' ? null : input.emergencyPhone;
      if (input.emergencyRelation !== undefined) mpUpdates.emergencyRelation = input.emergencyRelation || null;
      if (Object.keys(mpUpdates).length > 0) {
        await db.update(members).set(mpUpdates).where(eq(members.userId, userId));
      }
    }
  }
}

export type ProfileImageType = 'avatar' | 'cover';

export async function uploadProfileImage(
  userId: string,
  type: ProfileImageType,
  buffer: Buffer,
  mimetype: string,
): Promise<void> {
  const [person] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  const ext = extensionFromMime(mimetype);
  const objectName = `profiles/${userId}/${type}_${Date.now()}.${ext}`;
  await uploadFile(buffer, objectName, mimetype);

  if (type === 'avatar') {
    await db.update(users).set({ avatarKey: objectName }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ coverKey: objectName }).where(eq(users.id, userId));
  }
}

export async function getProfileImageObjectName(
  userId: string,
  type: ProfileImageType,
): Promise<{ data: string | null }> {
  const [person] = await db
    .select({ avatarKey: users.avatarKey, coverKey: users.coverKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!person) throw errors.notFound('User');
  const data = type === 'avatar' ? person.avatarKey ?? null : person.coverKey ?? null;
  return { data };
}

export async function sendVerificationEmail(userId: string): Promise<void> {
  const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.emailVerified) throw errors.badRequest('Email already verified');

  const verifyToken = ids.resetToken();
  await db.update(users).set({ emailVerifyToken: verifyToken }).where(eq(users.id, userId));

  const verifyUrl = `${env.FRONTEND_URL}/member/verify-email?token=${verifyToken}`;
  await sendEmail(
    person.email,
    'Verify Your Email — GymSphere',
    generateVerifyEmailHTML(person.fullName, verifyUrl),
  );
}

export async function verifyEmail(token: string): Promise<void> {
  const [row] = await db
    .select({ person: users })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .where(and(eq(users.emailVerifyToken, token), isNull(userLc.deletedAt)))
    .limit(1);

  const person = row?.person;
  if (!person) throw errors.badRequest('Invalid or expired verification token');
  if (person.emailVerified) throw errors.badRequest('Email already verified');

  await db.update(users).set({ emailVerified: true, emailVerifyToken: null }).where(eq(users.id, person.id));
}

export async function forgotPassword(email: string): Promise<void> {
  const [row] = await db
    .select({ person: users })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .where(and(eq(users.email, email), isNull(userLc.deletedAt)))
    .limit(1);

  const person = row?.person;
  if (!person) return;

  const resetToken = ids.resetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await db.update(users).set({ resetToken, resetExpires }).where(eq(users.id, person.id));

  const resetUrl = `${env.FRONTEND_URL}/member/reset-password?token=${resetToken}`;
  await sendEmail(
    person.email,
    'Reset Your Password — GymSphere',
    generateResetPasswordHTML(person.fullName, resetUrl),
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword);
  if (!validation.valid) throw errors.validation('Invalid password', validation.errors);

  const [row] = await db
    .select({ person: users })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .where(and(eq(users.resetToken, token), gt(users.resetExpires!, new Date()), isNull(userLc.deletedAt)))
    .limit(1);

  const person = row?.person;
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

export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<void> {
  const [person] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');
  if (person.role !== 'member') throw errors.forbidden('Onboarding is only for members');

  const [mp] = await db.select({ isOnboarded: members.isOnboarded })
    .from(members).where(eq(members.userId, userId)).limit(1);
  if (mp?.isOnboarded) throw errors.conflict('Onboarding already completed');

  await db.update(members).set({
    experienceLevel: input.experienceLevel,
    fitnessGoals: input.fitnessGoals,
    ...(input.bloodType != null && { bloodType: input.bloodType }),
    ...(input.medicalConditions != null && { medicalConditions: input.medicalConditions }),
    ...(input.allergies != null && { allergies: input.allergies }),
    ...(input.emergencyName != null && { emergencyName: input.emergencyName }),
    ...(input.emergencyPhone != null && { emergencyPhone: input.emergencyPhone }),
    ...(input.emergencyRelation != null && { emergencyRelation: input.emergencyRelation }),
    isOnboarded: true,
    onboardedAt: new Date(),
  }).where(eq(members.userId, userId));
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

function extensionFromMime(mimetype: string): string {
  return MIME_EXT[mimetype?.toLowerCase()] ?? 'jpg';
}

export type IdDocumentType = 'nic' | 'driving_license' | 'passport';

export async function uploadIdDocuments(
  userId: string,
  documentType: IdDocumentType,
  frontBuffer: Buffer,
  frontMimetype: string,
  backBuffer: Buffer | null,
  backMimetype: string | null,
): Promise<void> {
  const [current] = await db
    .select({ idVerificationStatus: members.idVerificationStatus })
    .from(members).where(eq(members.userId, userId)).limit(1);
  if (current?.idVerificationStatus === 'approved') {
    throw errors.conflict('Identity already verified. Contact support to update your documents.');
  }

  const ts = Date.now();
  const extFront = extensionFromMime(frontMimetype);
  const frontUrl = await uploadFile(frontBuffer, `id/${userId}/doc_front_${ts}.${extFront}`, frontMimetype);

  let backUrl: string | null = null;
  if (backBuffer && backMimetype) {
    const extBack = extensionFromMime(backMimetype);
    backUrl = await uploadFile(backBuffer, `id/${userId}/doc_back_${ts}.${extBack}`, backMimetype);
  }

  await db.update(members).set({
    idDocumentType: documentType,
    idNicFront: frontUrl,
    idNicBack: backUrl,
    idVerificationStatus: 'pending',
    idSubmittedAt: new Date(),
    idVerificationNote: null,
  }).where(eq(members.userId, userId));
}

export async function getIdSubmissions() {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      memberCode: members.memberCode,
      idDocumentType: members.idDocumentType,
      idNicFront: members.idNicFront,
      idNicBack: members.idNicBack,
      idVerificationStatus: members.idVerificationStatus,
      idVerificationNote: members.idVerificationNote,
      idSubmittedAt: members.idSubmittedAt,
    })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .innerJoin(members, eq(members.userId, users.id))
    .where(and(
      eq(users.role, 'member'),
      isNull(userLc.deletedAt),
      isNotNull(members.idNicFront),
    ));
}

export async function getIdDocumentObjectName(
  userId: string,
  type: 'front' | 'back',
): Promise<{ data: string | null }> {
  const [person] = await db
    .select({ idNicFront: members.idNicFront, idNicBack: members.idNicBack })
    .from(members)
    .where(eq(members.userId, userId))
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

  await db.update(members).set({
    idVerificationStatus: input.status,
    idVerificationNote: input.note ?? null,
  }).where(eq(members.userId, targetUserId));

  const subject = input.status === 'approved'
    ? 'Identity Verified — GymSphere'
    : 'Identity Verification Update — GymSphere';

  const body = generateIdVerificationHTML(person.fullName, input.status, input.note);
  sendEmail(person.email, subject, body).catch(err => console.error('ID verification email failed:', err));
}

export async function assertMemberCanPurchaseSubscription(userId: string): Promise<void> {
  const [person] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!person) throw errors.notFound('User');
  if (person.role !== 'member') return;

  const [m] = await db
    .select({ idVerificationStatus: members.idVerificationStatus })
    .from(members)
    .where(eq(members.userId, userId))
    .limit(1);
  if (m?.idVerificationStatus === 'rejected') {
    throw errors.forbidden('You cannot purchase a subscription while your ID verification is rejected. Please resubmit documents from your profile or contact support.');
  }
}
