import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();

router.get('/plans', PublicController.getSubscriptionPlans);
router.get('/branches', PublicController.getBranches);
router.get('/stats', PublicController.getLandingPageStats);
router.get('/trainers', PublicController.getFeaturedTrainers);

export default router;
