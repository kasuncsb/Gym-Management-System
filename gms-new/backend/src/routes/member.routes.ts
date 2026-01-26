// Member Routes
import { Router } from 'express';
import Joi from 'joi';
import { MemberController } from '../controllers/member.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validation schemas
const registerSchema = {
    body: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        phone: Joi.string().optional(),
        dateOfBirth: Joi.date().optional(),
        emergencyContact: Joi.string().max(200).optional()
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
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required()
    })
};

// Public routes
router.post('/register', validate(registerSchema), MemberController.register);

// Member routes (self)
router.get('/profile', authenticate, MemberController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), MemberController.updateProfile);

// Admin routes
router.get('/', authenticate, requireRole('ADMIN', 'MANAGER', 'RECEPTIONIST'), MemberController.getAllMembers);
router.get('/search', authenticate, requireRole('ADMIN', 'MANAGER', 'RECEPTIONIST'), MemberController.searchMembers);
router.get('/stats', authenticate, requireRole('ADMIN', 'MANAGER'), MemberController.getStats);
router.get('/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'RECEPTIONIST'), MemberController.getProfile);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(updateProfileSchema), MemberController.updateProfile);
router.put('/:id/status', authenticate, requireRole('ADMIN'), validate(updateStatusSchema), MemberController.updateStatus);
router.delete('/:id', authenticate, requireRole('ADMIN'), MemberController.deleteMember);

export default router;
