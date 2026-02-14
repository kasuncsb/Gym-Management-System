// Notification Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
  /** Get my notifications */
  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const unreadOnly = req.query.unreadOnly === 'true';
      const data = await NotificationService.getUserNotifications(req.user!.userId, limit, unreadOnly);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get unread count */
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) { next(error); }
  }

  /** Mark as read */
  static async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markRead(req.params.id as string, req.user!.userId);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) { next(error); }
  }

  /** Mark all as read */
  static async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllRead(req.user!.userId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) { next(error); }
  }
}
