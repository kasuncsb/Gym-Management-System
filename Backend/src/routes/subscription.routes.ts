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

// Purchase (member)
router.post('/purchase', authenticate, SubscriptionController.purchaseSubscription);

// Freeze / Unfreeze (member or admin)
router.post('/:id/freeze', authenticate, SubscriptionController.freezeSubscription);
router.post('/:id/unfreeze', authenticate, SubscriptionController.unfreezeSubscription);

// Admin routes
router.get('/member/:memberId/validate', authenticate, requireRole('admin', 'manager'), SubscriptionController.validateSubscription);
router.get('/member/:memberId', authenticate, requireRole('admin', 'manager'), SubscriptionController.getMemberSubscriptions);
router.get('/renewals/upcoming', authenticate, requireRole('admin', 'manager'), SubscriptionController.getUpcomingRenewals);

// Admin plan CRUD
router.post('/plans', authenticate, requireRole('admin'), SubscriptionController.createPlan);
router.put('/plans/:id', authenticate, requireRole('admin'), SubscriptionController.updatePlan);
router.delete('/plans/:id', authenticate, requireRole('admin'), SubscriptionController.deletePlan);

export default router;
