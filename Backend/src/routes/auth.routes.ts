// Authentication Routes
import { Router } from 'express';
import Joi from 'joi';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { loginRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Validation schemas
const loginSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        userType: Joi.string().valid('member', 'trainer', 'staff').optional()
    })
};

const refreshTokenSchema = {
    body: Joi.object({
        refreshToken: Joi.string().required()
    })
};


const changePasswordSchema = {
    body: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).required()
    })
};

const verifyEmailSchema = {
    body: Joi.object({
        token: Joi.string().required()
    })
};

const forgotPasswordSchema = {
    body: Joi.object({
        email: Joi.string().email().required()
    })
};

const resetPasswordSchema = {
    body: Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(8).required()
    })
};

// Public routes
router.post('/login', loginRateLimit, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/forgot-password', loginRateLimit, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/qr-code', authenticate, AuthController.generateQR);

export default router;

