import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireVerified } from '../middleware/require-verified.js';
import { validate } from '../middleware/error.js';
import * as auth from '../controllers/auth.controller.js';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  onboardingSchema,
  idVerificationSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Multer — in-memory storage for OCI uploads. Max 5MB per file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG or WebP images are accepted'));
    }
  },
});

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/login',           validate(loginSchema),          auth.login);
router.post('/register',        validate(registerSchema),       auth.register);
router.post('/refresh',                                         auth.refresh);
router.post('/verify-email',    validate(verifyEmailSchema),    auth.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),  auth.resetPassword);

// ── Protected ────────────────────────────────────────────────────────────────
router.get( '/profile',           authenticate,                                                               auth.getProfile);
router.post('/send-verification', authenticate,                                                               auth.sendVerificationEmail);
router.post('/change-password',   authenticate, requireVerified, validate(changePasswordSchema),              auth.changePassword);
router.post('/logout',            authenticate,                                                               auth.logout);
router.post('/onboarding',        authenticate, validate(onboardingSchema),                                   auth.completeOnboarding);
router.post('/upload-id',         authenticate, upload.fields([{ name: 'nic_front', maxCount: 1 }, { name: 'nic_back', maxCount: 1 }]), auth.uploadIdDocuments);

// ── Admin only ───────────────────────────────────────────────────────────────
router.get( '/admin/id-submissions',        authenticate, authorize('admin'),                                   auth.getIdSubmissions);
router.get( '/admin/id-document/:userId/:type', authenticate, authorize('admin'),                               auth.downloadIdDocument);
router.post('/admin/verify-id/:id',          authenticate, authorize('admin'), validate(idVerificationSchema),   auth.adminVerifyId);

export default router;
