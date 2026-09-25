import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import aiRouter from '../modules/ai/ai.routes.js';
import categoryRouter from '../modules/categories/category.routes.js';
import opportunityRouter from '../modules/opportunities/opportunity.routes.js';
import inventoryRouter from '../modules/inventory/inventory.routes.js';
import saleRouter from '../modules/sales/sale.routes.js';
import trainingRouter from '../modules/trainings/training.routes.js';
import applicationRouter from '../modules/applications/application.routes.js';
import userController from '../modules/users/user.controller.js';
import businessController from '../modules/business/business.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { successResponse } from '../utils/response.js';

const router = Router();

// Mount modules
router.use('/auth', authRouter);
router.use('/ai', aiRouter);
router.use('/categories', categoryRouter);
router.use('/opportunities', opportunityRouter);
router.use('/inventory', inventoryRouter);
router.use('/sales', saleRouter);
router.use('/trainings', trainingRouter);
router.use('/applications', applicationRouter);

// Profile endpoints accessible by logged-in users
router.get('/users/profile', authenticate, userController.getProfile);

// Business endpoints restricted to BUSINESS users
router.get('/business/me', authenticate, authorize('BUSINESS'), businessController.getMyBusiness);
router.put('/business/profile', authenticate, authorize('BUSINESS'), businessController.updateBusinessProfile);
router.get('/business/dashboard', authenticate, authorize('BUSINESS'), businessController.getDashboard);
router.get('/business/ledger', authenticate, authorize('BUSINESS'), businessController.getLedger);
router.post('/business/ledger', authenticate, authorize('BUSINESS'), businessController.createLedgerEntry);
router.delete('/business/ledger/:id', authenticate, authorize('BUSINESS'), businessController.deleteLedgerEntry);
router.get('/portfolio/businesses', authenticate, authorize('FINANCIAL_INSTITUTION', 'ADMIN'), businessController.getPortfolio);

// Financial Institution profile update
router.put('/financial-institution/profile', authenticate, authorize('FINANCIAL_INSTITUTION', 'ADMIN'), userController.updateFinancialInstitutionProfile);

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

// Admin User Management endpoints
router.get('/admin/users', authenticate, authorize('ADMIN'), userController.getAllUsers);
router.patch('/admin/users/:id/approve', authenticate, authorize('ADMIN'), userController.approveUser);
router.delete('/admin/users/:id', authenticate, authorize('ADMIN'), userController.deleteUser);

export default router;
