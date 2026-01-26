// QR Scan Controller - UC-01
import { Request, Response } from 'express';
import { DoorAccessService } from '../services/door-access.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

export class QRScanController {
    // UC-01: Process QR code scan
    static scanQR = asyncHandler(async (req: Request, res: Response) => {
        const { qrData, gateId = 'GATE01', deviceId = 'SCANNER01', location = 'Main Entrance' } = req.body;

        const result = await DoorAccessService.processQRScan(qrData, gateId, deviceId, location);

        res.json(successResponse(result, result.message));
    });

    // Get member's attendance history
    static getAttendanceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.user!.role === 'member' ? req.user!.id : req.query.memberId as string;
        const limit = parseInt(req.query.limit as string) || 50;

        const history = await DoorAccessService.getAttendanceHistory(memberId, undefined, undefined, limit);

        res.json(successResponse(history, 'Attendance history retrieved'));
    });

    // Get door access logs (admin only)
    static getAccessLogs = asyncHandler(async (req: Request, res: Response) => {
        const { startDate, endDate, status, limit } = req.query;

        const logs = await DoorAccessService.getAccessLogs(
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined,
            status as 'GRANTED' | 'DENIED' | undefined,
            limit ? parseInt(limit as string) : 100
        );

        res.json(successResponse(logs, 'Access logs retrieved'));
    });
}
