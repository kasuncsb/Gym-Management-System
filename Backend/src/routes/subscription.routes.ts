// Subscription Routes
import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Member routes
router.get('/validate', authenticate, SubscriptionController.validateSubscription);
router.get('/my-subscriptions', authenticate, SubscriptionController.getMemberSubscriptions);
router.get('/active', authenticate, SubscriptionController.getActiveSubscription);

// Public/member routes
router.get('/plans', SubscriptionController.getAllPlans);
router.get('/plans/:id', SubscriptionController.getPlanById);

// Admin routes
router.get('/member/:memberId/validate', authenticate, requireRole('ADMIN', 'MANAGER', 'RECEPTIONIST'), SubscriptionController.validateSubscription);
router.get('/member/:memberId', authenticate, requireRole('ADMIN', 'MANAGER'), SubscriptionController.getMemberSubscriptions);
router.get('/renewals/upcoming', authenticate, requireRole('ADMIN', 'MANAGER'), SubscriptionController.getUpcomingRenewals);

export default router;
