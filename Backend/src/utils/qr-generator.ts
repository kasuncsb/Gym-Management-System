// QR Code generation & validation — persistent secret per user (Phase 1)
//
// Flow:
//   1. Each user has a `qrCodeSecret` stored in users table.
//      If not present, we generate one when the QR is first requested.
//   2. The QR payload is:  JSON { userId, sig }
//      where sig = HMAC-SHA256( userId, userSecret + globalSecret )
//   3. On scan, we look up the user, recompute the sig, and compare.
//   4. No expiry on the QR itself — access decisions (subscription, business hours)
//      are checked at scan time.

import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '../config/env';

// ---- Generation -----------------------------------------------------------

export function deriveSignature(userId: string, userSecret: string): string {
  return crypto
    .createHmac('sha256', userSecret + env.QR_SECRET)
    .update(userId)
    .digest('hex');
}

export function buildQRPayload(userId: string, userSecret: string): string {
  const sig = deriveSignature(userId, userSecret);
  return JSON.stringify({ userId, sig });
}

/** Render a QR code data-URL image from the JSON payload. */
export async function generateQRDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

/** Generate a cryptographically random hex secret for a new user. */
export function generateUserSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ---- Validation -----------------------------------------------------------

export interface QRValidationResult {
  valid: boolean;
  userId?: string;
  reason?: string;
}

/**
 * Parse + validate a QR payload string.
 * Returns the userId if the signature matches; otherwise `valid: false`.
 */
export function validateQRPayload(
  raw: string,
  knownUserSecret: string,
): QRValidationResult {
  try {
    const parsed = JSON.parse(raw) as { userId?: string; sig?: string };

    if (!parsed.userId || !parsed.sig) {
      return { valid: false, reason: 'Malformed QR payload' };
    }

    const expected = deriveSignature(parsed.userId, knownUserSecret);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(parsed.sig, 'hex'),
    );

    if (!isValid) {
      return { valid: false, userId: parsed.userId, reason: 'Invalid signature' };
    }

    return { valid: true, userId: parsed.userId };
  } catch {
    return { valid: false, reason: 'Invalid QR data' };
  }
}
