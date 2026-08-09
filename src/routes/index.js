import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import userController from '../modules/users/user.controller.js';
import businessController from '../modules/business/business.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { successResponse } from '../utils/response.js';

const router = Router();

// Mount modules
router.use('/auth', authRouter);

// Profile endpoint accessible by any logged-in user
router.get('/users/profile', authenticate, userController.getProfile);

// Business endpoints restricted to BUSINESS users
router.get('/business/me', authenticate, authorize('BUSINESS'), businessController.getMyBusiness);

// Admin-only endpoints
router.get('/admin/dashboard', authenticate, authorize('ADMIN'), (req, res) => {
  return successResponse(res, 'Admin metrics retrieved successfully', {
    admin: req.user,
    stats: {
      registeredBusinesses: 24,
      systemStatus: 'Healthy',
      apiVersion: '1.0.0'
    }
  });
});

export default router;
