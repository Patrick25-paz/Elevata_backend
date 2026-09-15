import { Router } from 'express';
import authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
	registerSchema,
	loginSchema,
	emailSchema,
	emailCodeSchema,
	forgotPasswordSchema,
	resetPasswordSchema
} from './auth.validation.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/send-verification-code', validate(emailSchema), authController.sendVerificationCode);
router.post('/verify-code', validate(emailCodeSchema), authController.verifyCode);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);

export default router;
