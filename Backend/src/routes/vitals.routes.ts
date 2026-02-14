// Vitals Routes — Phase 2
import { Router } from 'express';
import { VitalsController } from '../controllers/vitals.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Member self-service
router.post('/me', VitalsController.recordOwnVitals);
router.get('/me', VitalsController.getOwnHistory);

// Staff/Trainer/Admin recording
router.post('/:memberId', requireRole('staff', 'trainer', 'manager', 'admin'), VitalsController.recordVitals);
router.get('/:memberId', requireRole('staff', 'trainer', 'manager', 'admin'), VitalsController.getHistory);
router.get('/:memberId/latest', requireRole('staff', 'trainer', 'manager', 'admin'), VitalsController.getLatest);
router.get('/:memberId/trend', requireRole('staff', 'trainer', 'manager', 'admin'), VitalsController.getTrend);
router.post('/:memberId/complete-onboarding', requireRole('staff', 'manager', 'admin'), VitalsController.completeOnboarding);

export default router;
