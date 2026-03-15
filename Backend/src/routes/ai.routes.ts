import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ai from '../controllers/ai.controller.js';

const router = Router();

router.get('/health', ai.health);
router.post('/chat', authenticate, ai.chat);
router.post('/insights', authenticate, authorize('manager', 'admin'), ai.insights);
router.post('/workout-plan', authenticate, authorize('member', 'trainer', 'manager', 'admin'), ai.workoutPlan);

export default router;

