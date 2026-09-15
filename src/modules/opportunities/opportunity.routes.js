import { Router } from 'express';
import opportunityController from './opportunity.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Public / Authenticated read routes
router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunityById);

// Financial Institution & Admin creation & management routes
router.post(
  '/',
  authenticate,
  authorize('FINANCIAL_INSTITUTION', 'ADMIN'),
  opportunityController.createOpportunity
);

router.put(
  '/:id',
  authenticate,
  authorize('FINANCIAL_INSTITUTION', 'ADMIN'),
  opportunityController.updateOpportunity
);

router.delete(
  '/:id',
  authenticate,
  authorize('FINANCIAL_INSTITUTION', 'ADMIN'),
  opportunityController.deleteOpportunity
);

export default router;
