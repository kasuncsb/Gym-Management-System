// Health Connect Routes — Phase 3
import { Router } from 'express';
import { HealthConnectController } from '../controllers/health-connect.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// OAuth callback (no auth required — user is redirected from Google)
router.get('/callback', HealthConnectController.handleCallback);

// Authenticated routes
router.use(authenticate);
router.post('/connect', requireRole('member'), HealthConnectController.initiateOAuth);
router.get('/status', requireRole('member'), HealthConnectController.getStatus);
router.post('/disconnect', requireRole('member'), HealthConnectController.disconnect);
router.post('/sync', requireRole('member'), HealthConnectController.syncData);
router.post('/simulate', requireRole('member', 'admin'), HealthConnectController.simulateSync);

export default router;
