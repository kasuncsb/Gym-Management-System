// QR Code generation and validation utilities
import QRCode from 'qrcode';
import crypto from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'default-qr-secret-change-this';
const QR_TOKEN_EXPIRES_IN = parseInt(process.env.QR_TOKEN_EXPIRES_IN || '300', 10); // 5 minutes

interface QRCodeData {
    memberId: string;
    timestamp: number;
    signature: string;
}

export async function generateQRCode(memberId: string): Promise<string> {
    const timestamp = Date.now();
    const dataToSign = `${memberId}:${timestamp}`;
    const signature = crypto
        .createHmac('sha256', QR_SECRET)
        .update(dataToSign)
        .digest('hex');

    const qrData: QRCodeData = {
        memberId,
        timestamp,
        signature
    };

    const qrString = JSON.stringify(qrData);
    const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1
    });

    return qrCodeDataUrl;
}

export function generateQRToken(memberId: string): string {
    const timestamp = Date.now();
    const dataToSign = `${memberId}:${timestamp}`;
    const signature = crypto
        .createHmac('sha256', QR_SECRET)
        .update(dataToSign)
        .digest('hex');

    return `${memberId}:${timestamp}:${signature}`;
}

export function validateQRToken(token: string): {
    valid: boolean;
    memberId?: string;
    reason?: string;
} {
    try {
        const parts = token.split(':');
        if (parts.length !== 3) {
            return { valid: false, reason: 'Invalid token format' };
        }

        const [memberId, timestampStr, receivedSignature] = parts;
        const timestamp = parseInt(timestampStr, 10);

        // Check if timestamp is valid
        if (isNaN(timestamp)) {
            return { valid: false, reason: 'Invalid timestamp' };
        }

        // Check if token is expired
        const now = Date.now();
        const expiresAt = timestamp + QR_TOKEN_EXPIRES_IN * 1000;
        if (now > expiresAt) {
            return { valid: false, reason: 'QR code expired' };
        }

        // Verify signature
        const dataToSign = `${memberId}:${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', QR_SECRET)
            .update(dataToSign)
            .digest('hex');

        if (receivedSignature !== expectedSignature) {
            return { valid: false, reason: 'Invalid signature' };
        }

        return { valid: true, memberId };
    } catch (error) {
        return { valid: false, reason: 'Token validation failed' };
    }
}

export function parseQRCode(qrString: string): {
    valid: boolean;
    memberId?: string;
    reason?: string;
} {
    try {
        const qrData: QRCodeData = JSON.parse(qrString);
        const { memberId, timestamp, signature } = qrData;

        // Check if token is expired
        const now = Date.now();
        const expiresAt = timestamp + QR_TOKEN_EXPIRES_IN * 1000;
        if (now > expiresAt) {
            return { valid: false, reason: 'QR code expired' };
        }

        // Verify signature
        const dataToSign = `${memberId}:${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', QR_SECRET)
            .update(dataToSign)
            .digest('hex');

        if (signature !== expectedSignature) {
            return { valid: false, reason: 'Invalid signature' };
        }

        return { valid: true, memberId };
    } catch (error) {
        return { valid: false, reason: 'Invalid QR code format' };
    }
}
