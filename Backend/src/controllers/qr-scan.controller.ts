// QR Scan Controller — Phase 1
import { Request, Response } from 'express';
import { DoorAccessService } from '../services/door-access.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

export class QRScanController {
  /** Process QR code scan from gate/kiosk */
  static scanQR = asyncHandler(async (req: Request, res: Response) => {
    const { qrData, gateId } = req.body;
    const result = await DoorAccessService.processQRScan(qrData, gateId);
    res.json(successResponse(result, result.message));
  });

  /** Attendance history (member self or admin lookup) */
  static getAttendanceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.role === 'member' ? req.user!.userId : (req.query.userId as string);
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await DoorAccessService.getAttendanceHistory(userId, limit);
    res.json(successResponse(history, 'Attendance history retrieved'));
  });

  /** Access logs (admin/manager) */
  static getAccessLogs = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, authorized, limit } = req.query;
    const logs = await DoorAccessService.getAccessLogs({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      authorized: authorized !== undefined ? authorized === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });
    res.json(successResponse(logs, 'Access logs retrieved'));
  });
}
