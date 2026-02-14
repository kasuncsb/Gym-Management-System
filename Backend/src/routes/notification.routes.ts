// Notification Routes — Phase 2 + Phase 3 enhancements
import { Router, Request, Response, NextFunction } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { NotificationScheduler } from '../services/notification-scheduler.service';

const router = Router();
router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/read-all', NotificationController.markAllRead);

// Phase 3 — Admin trigger for processing scheduled notifications
router.post('/process-scheduled', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await NotificationScheduler.processAll();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
