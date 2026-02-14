import { Router } from 'express';
import Joi from 'joi';
import { MemberController } from '../controllers/member.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { registrationRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Validation schemas
const registerSchema = {
    body: Joi.object({
        name: Joi.string().min(2).max(100).trim().required(),
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(8)
            .pattern(/^(?=.*[A-Z])(?=.*[0-9])/)
            .message('Password must contain at least one uppercase letter and one number')
            .required(),
        phone: Joi.string().trim().max(20).optional().allow(''),
        dateOfBirth: Joi.date().max('now').optional(),
        emergencyContact: Joi.string().trim().max(200).optional().allow('')
    })
};

const updateProfileSchema = {
    body: Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        phone: Joi.string().optional(),
        dateOfBirth: Joi.date().optional(),
        emergencyContact: Joi.string().max(200).optional()
    })
};

const updateStatusSchema = {
    body: Joi.object({
        status: Joi.string().valid('active', 'inactive', 'suspended').required()
    })
};

// Public routes
router.post('/register', registrationRateLimit, validate(registerSchema), MemberController.register);

// Member routes (self)
router.get('/profile', authenticate, MemberController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), MemberController.updateProfile);
router.post('/documents', authenticate, MemberController.uploadDocument);

// Admin routes
router.get('/', authenticate, requireRole('admin', 'manager'), MemberController.getAllMembers);
router.get('/search', authenticate, requireRole('admin', 'manager'), MemberController.searchMembers);
router.get('/stats', authenticate, requireRole('admin', 'manager'), MemberController.getStats);
router.get('/:id', authenticate, requireRole('admin', 'manager'), MemberController.getProfile);
router.put('/:id', authenticate, requireRole('admin', 'manager'), validate(updateProfileSchema), MemberController.updateProfile);
router.put('/:id/status', authenticate, requireRole('admin'), validate(updateStatusSchema), MemberController.updateStatus);
router.delete('/:id', authenticate, requireRole('admin'), MemberController.deleteMember);

export default router;
