// Health Connect Controller — Phase 3
import { Request, Response, NextFunction } from 'express';
import { HealthConnectService } from '../services/health-connect.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class HealthConnectController {
  /** Member initiates OAuth linking */
  static async initiateOAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await HealthConnectService.initiateOAuth(
        req.user!.userId,
        req.body.memberId || req.user!.userId,
      );
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** OAuth callback */
  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { state, code } = req.query;
      const data = await HealthConnectService.handleCallback(state as string, code as string);
      // In production, redirect to frontend success page
      res.json({ success: true, data, message: 'Health Connect linked successfully' });
    } catch (error) { next(error); }
  }

  /** Check connection status */
  static async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await HealthConnectService.getConnectionStatus(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Disconnect */
  static async disconnect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await HealthConnectService.disconnect(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Trigger manual sync */
  static async syncData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await HealthConnectService.syncData(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Simulate full day sync (demo) */
  static async simulateSync(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await HealthConnectService.simulateFullDaySync(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
