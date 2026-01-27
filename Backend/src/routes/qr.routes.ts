// QR Scan Routes
import { Router } from 'express';
import Joi from 'joi';
import { QRScanController } from '../controllers/qr-scan.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { qrScanRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Validation schemas
const scanQRSchema = {
    body: Joi.object({
        qrData: Joi.string().required(),
        gateId: Joi.string().optional(),
        deviceId: Joi.string().optional(),
        location: Joi.string().optional()
    })
};

// QR scan endpoint (public or kiosk device)
router.post('/scan', qrScanRateLimit, validate(scanQRSchema), QRScanController.scanQR);

// Attendance history (member or admin)
router.get('/attendance/history', authenticate, QRScanController.getAttendanceHistory);

// Access logs (admin only)
router.get('/access-logs', authenticate, requireRole('admin', 'manager'), QRScanController.getAccessLogs);

export default router;
