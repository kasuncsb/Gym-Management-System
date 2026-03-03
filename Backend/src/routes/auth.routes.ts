import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rate-limit.js';
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public - with rate limiting
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/refresh', validate(refreshSchema), auth.refresh);
router.post('/verify-email', validate(verifyEmailSchema), auth.verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), auth.resetPassword);

// Protected
router.get('/profile', authenticate, auth.getProfile);
router.post('/send-verification', authenticate, auth.sendVerificationEmail);
router.post('/change-password', authenticate, validate(changePasswordSchema), auth.changePassword);
router.post('/logout', authenticate, auth.logout);

export default router;
