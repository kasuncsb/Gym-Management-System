import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';
// Rate limit could be applied here if needed, but app.ts has global api rate limit

const router = Router();

// Public endpoints
router.get('/plans', PublicController.getSubscriptionPlans);
router.get('/branches', PublicController.getBranches);
router.get('/stats', PublicController.getLandingPageStats);
router.get('/trainers', PublicController.getFeaturedTrainers);
router.get('/classes', PublicController.getClasses);

export default router;
