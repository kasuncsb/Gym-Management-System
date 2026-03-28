import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { aiChatUserRateLimiter } from '../middleware/rate-limit.js';
import * as ai from '../controllers/ai.controller.js';

const router = Router();

router.get('/health', ai.health);
router.get('/chat/history', authenticate, ai.chatHistory);
router.post('/chat', authenticate, aiChatUserRateLimiter, ai.chat);
router.post('/insights', authenticate, authorize('manager', 'admin'), ai.insights);
router.post('/workout-plan', authenticate, authorize('member', 'trainer', 'manager', 'admin'), ai.workoutPlan);

export default router;

