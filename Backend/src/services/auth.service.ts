// Authentication Service — Phase 1 rewrite
// - JWT uses users.id everywhere (no profile-ID confusion)
// - Separate access / refresh secrets
// - Refresh tokens stored in DB with rotation
// - Account lockout after 5 failed attempts

import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto, { randomUUID } from 'crypto';
import { eq, and, isNull, gt, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { users, members, trainers, staff, refreshTokens } from '../db/schema';
import { env } from '../config/env';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/error-types';
import { validateEmail, validatePassword } from '../utils/validators';
import { buildQRPayload, generateQRDataUrl, generateUserSecret } from '../utils/qr-generator';
import { EmailService } from './email.service';
import { AuditService, AuditAction } from './audit.service';
import type { JWTPayload } from '../middleware/auth.middleware';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ---- Helpers ---------------------------------------------------------------

function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationMs(dur: string): number {
  const match = dur.match(/^(\d+)(m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

// ---- Service ---------------------------------------------------------------

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export class AuthService {
  // ---- Login ---------------------------------------------------------------

  static async login(email: string, password: string, req?: Request): Promise<LoginResult> {
    if (!validateEmail(email)) throw new ValidationError('Invalid email format');

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase().trim()), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AuthenticationError('Invalid credentials');

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError('Account temporarily locked. Try again later.');
    }

    // Password check
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const newCount = (user.failedLoginAttempts ?? 0) + 1;
      const lockUntil =
        newCount >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;

      await db
        .update(users)
        .set({ failedLoginAttempts: newCount, lockedUntil: lockUntil })
        .where(eq(users.id, user.id));

      throw new AuthenticationError('Invalid credentials');
    }

    // Active checks
    if (!user.isActive) throw new AuthenticationError('Account is deactivated');
    if (!user.isEmailVerified) throw new AuthenticationError('Please verify your email first');

    // Reset failed attempts on success
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const payload: JWTPayload = { userId: user.id, email: user.email, role: user.role as JWTPayload['role'] };
    const accessToken = signAccessToken(payload);
    const rawRefresh = signRefreshToken(user.id);

    // Store hashed refresh token
    await db.insert(refreshTokens).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(rawRefresh),
      deviceInfo: req?.headers['user-agent']?.substring(0, 255) ?? null,
      ipAddress: ((req?.headers['x-forwarded-for'] as string) || req?.socket?.remoteAddress || '').substring(0, 45),
      expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)),
    });

    await AuditService.log(AuditAction.LOGIN, 'users', user.id, user.id, { email: user.email, role: user.role }, req);

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }

  // ---- Refresh Token -------------------------------------------------------

  static async refreshAccessToken(rawRefresh: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: { userId: string; type: string };
    try {
      decoded = jwt.verify(rawRefresh, env.JWT_REFRESH_SECRET) as any;
      if (decoded.type !== 'refresh') throw new Error();
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawRefresh);

    // Look up stored token
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.isRevoked, false)))
      .limit(1);

    if (!stored || stored.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token revoked or expired');
    }

    // Look up user
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(and(eq(users.id, decoded.userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user || !user.isActive) throw new AuthenticationError('User not found or deactivated');

    // Rotate: revoke old, issue new
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.id, stored.id));

    const newRawRefresh = signRefreshToken(user.id);
    await db.insert(refreshTokens).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(newRawRefresh),
      ipAddress: stored.ipAddress,
      deviceInfo: stored.deviceInfo,
      expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)),
    });

    const payload: JWTPayload = { userId: user.id, email: user.email, role: user.role as JWTPayload['role'] };
    return { accessToken: signAccessToken(payload), refreshToken: newRawRefresh };
  }

  // ---- Logout (revoke all refresh tokens) ----------------------------------

  static async logout(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  // ---- Password Hashing ----------------------------------------------------

  static async hashPassword(password: string): Promise<string> {
    const validation = validatePassword(password);
    if (!validation.valid) throw new ValidationError(validation.errors.join('; '));
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  // ---- Change Password -----------------------------------------------------

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User');

    const isOldValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldValid) throw new AuthenticationError('Current password is incorrect');

    const newHash = await this.hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

    // Revoke all refresh tokens (force re-login on other devices)
    await this.logout(userId);

    await AuditService.log(AuditAction.CHANGE_PASSWORD, 'users', userId, userId);
  }

  // ---- QR Code Generation --------------------------------------------------

  static async generateMemberQR(userId: string): Promise<{ qrCodeDataUrl: string; payload: string }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.deletedAt) throw new NotFoundError('User');
    if (!user.isActive) throw new ValidationError('Account is not active');

    // Ensure user has a qrCodeSecret; generate if missing
    let secret = user.qrCodeSecret;
    if (!secret) {
      secret = generateUserSecret();
      await db.update(users).set({ qrCodeSecret: secret, lastQrGeneratedAt: new Date() }).where(eq(users.id, userId));
    } else {
      await db.update(users).set({ lastQrGeneratedAt: new Date() }).where(eq(users.id, userId));
    }

    const payload = buildQRPayload(userId, secret);
    const qrCodeDataUrl = await generateQRDataUrl(payload);

    return { qrCodeDataUrl, payload };
  }

  // ---- Email Verification --------------------------------------------------

  static async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) throw new ValidationError('Invalid or expired verification link');
    if (user.isEmailVerified) throw new ValidationError('Email already verified');

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      await db.update(users).set({ emailVerificationToken: null, emailVerificationExpires: null }).where(eq(users.id, user.id));
      throw new ValidationError('Verification link has expired. Please request a new one');
    }

    await db.update(users).set({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      isActive: true,
    }).where(eq(users.id, user.id));

    await AuditService.log(AuditAction.VERIFY_EMAIL, 'users', user.id, user.id);
    return true;
  }

  // ---- Forgot / Reset Password ---------------------------------------------

  static async forgotPassword(email: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const token = randomUUID();
    const expires = new Date(Date.now() + 3600000);

    if (user) {
      await db.update(users).set({ passwordResetToken: token, passwordResetExpires: expires }).where(eq(users.id, user.id));
      try { await EmailService.sendPasswordResetEmail(user.email, token); } catch { /* ignore */ }
    } else {
      await new Promise(r => setTimeout(r, 100 + Math.random() * 50));
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const validation = validatePassword(newPassword);
    if (!validation.valid) throw new ValidationError(validation.errors.join('; '));

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.passwordResetToken, token), gt(users.passwordResetExpires, new Date())))
      .limit(1);

    if (!user) throw new ValidationError('Invalid or expired reset link');

    const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await db.update(users).set({ passwordHash: hash, passwordResetToken: null, passwordResetExpires: null }).where(eq(users.id, user.id));
    await this.logout(user.id);
    await AuditService.log(AuditAction.RESET_PASSWORD, 'users', user.id, user.id);
  }
}

